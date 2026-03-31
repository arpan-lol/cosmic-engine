import { EnhancedContext } from '../../llm/retrieval.service';
import { BM25Search } from './bm25-search.service';
import { SearchService } from '../../milvus/index';
import { dynamicTopK } from '../../../config/rag.config';
import prisma from 'src/prisma/client';
import { NotFoundError, ValidationError } from 'src/types/errors';
import { sseService } from 'src/services/sse.service';
import { PerformanceTracker } from '../../../utils/timer.util';

interface HybridHit {
  attachmentId: string;
  chunkIndex: number;
  vectorRank?: number;
  bm25Rank?: number;
  vectorScore?: number;
  bm25Score?: number;
  content?: string;
  filename?: string;
  pageNumber?: number;
  rrfScore?: number;
}

export class HybridSearchService {
  static async search(
    sessionId: string,
    query: string,
    attachmentIds: string[],
    timer?: PerformanceTracker
  ): Promise<EnhancedContext[]> {
    try {
      const totalTopK = dynamicTopK(attachmentIds.length);
      const topKPerDoc = Math.ceil(totalTopK / attachmentIds.length);

      // quick log
      console.log(
        `[HybridSearch] Searching ${attachmentIds.length} attachment(s) with topK=${totalTopK} (${topKPerDoc} per doc)`
      );

      // batch fetch attachment metadata to avoid per-file DB calls
      const attachments = await prisma.attachment.findMany({
        where: { id: { in: attachmentIds } }
      });

      if (attachments.length !== attachmentIds.length) {
        const foundIds = new Set(attachments.map((a: any) => a.id));
        const missing = attachmentIds.filter((id) => !foundIds.has(id));
        throw new NotFoundError(`Missing attachments: ${missing.join(', ')}`);
      }

      // validate bm25 index status for all attachments up-front
      const notCompleted = attachments.filter((a: any) => a.bm25indexStatus !== 'completed');
      if (notCompleted.length) {
        const list = notCompleted.map((a: any) => `${a.id}:${a.bm25indexStatus}`).join(', ');
        throw new ValidationError(
          `All files must be BM25 indexed before using hybrid search. Problematic files: ${list}`
        );
      }

      // publish a top-level "search started" event
      await sseService.publishToSession(sessionId, {
        type: 'notification',
        scope: 'session',
        message: 'hybrid-search-started',
        data: {
          title: `Hybrid search started`,
          body: [`Query: ${query}`, `Attachments: ${attachmentIds.length}`, `topK: ${totalTopK}`]
        },
        timestamp: new Date().toISOString()
      });

      const hybridMap = new Map<string, HybridHit>();

      // process each attachment and publish per-attachment results/progress
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i] as any;
        const attachmentId = att.id as string;

        timer?.startAttachmentTimer('vectorSearch', attachmentId);
        timer?.startAttachmentTimer('bm25Search', attachmentId);
        
        const [vecHits, bmData] = await Promise.all([
          SearchService.search(sessionId, query, topKPerDoc, attachmentId),
          BM25Search.search(attachmentId, query, topKPerDoc)
        ]);
        
        const vectorDuration = timer?.endAttachmentTimer('vectorSearch', attachmentId);
        const bm25Duration = timer?.endAttachmentTimer('bm25Search', attachmentId);

        // publish an interim event for this attachment with concise info
        try {
          const vecPreview = (vecHits || []).slice(0, 3).map((h: any) =>
            `Chunk ${h.chunkIndex}: ${(h.score ?? 0).toFixed(3)}${h.filename ? ` (${h.filename})` : ''}`
          );

          const bmTerms = (bmData.rows || []).slice(0, 5).map((r: any) =>
            `"${r.term}" tf:${r.tf} df:${r.df}`
          );

          const bmScores = Object.entries(bmData.scores || {})
            .slice(0, 5)
            .map(([chunkIndex, score]) => `Chunk ${chunkIndex}: ${(score as number).toFixed(3)}`);

          const body: string[] = [
            `Attachment: ${att.filename ?? 'file'}`,
            `Vector hits: ${(vecHits || []).length}`,
            ...vecPreview,
            '---',
            'Top BM25 terms:',
            ...bmTerms,
            'Top BM25 chunk scores (raw, unnormalized):',
            ...bmScores
          ];

          await sseService.publishToSession(sessionId, {
            type: 'notification',
            scope: 'session',
            message: 'hybrid-search-attachment-complete',
            data: {
              title: `Search results for ${att.filename ?? 'file'}`,
              body
            },
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          // don't fail the whole search if publishing fails; just log
          console.warn('[HybridSearch] SSE publish failed for attachment', attachmentId, err);
        }

        (vecHits || []).forEach((hit: any) => {
          const key = `${hit.attachmentId}:${hit.chunkIndex}`;

          // get existing and ensure it's typed as HybridHit
          let existing = hybridMap.get(key) as HybridHit | undefined;
          if (!existing) {
            existing = {
              attachmentId: hit.attachmentId,
              chunkIndex: hit.chunkIndex,
            };
          }

          existing.vectorScore = hit.score;
          existing.content = hit.content;
          existing.filename = hit.filename;
          existing.pageNumber = hit.pageNumber;

          hybridMap.set(key, existing);
        });

        // merge bm25 hits
        const bmHits = bmData.data || [];
        bmHits.forEach((hit: any) => {
          const key = `${attachmentId}:${hit.chunkIndex}`;

          let existing = hybridMap.get(key) as HybridHit | undefined;
          if (!existing) {
            existing = {
              attachmentId,
              chunkIndex: hit.chunkIndex,
            };
          }

          existing.bm25Score = hit.score;

          hybridMap.set(key, existing);
        });

        // publish progress (simple percentage)
        try {
          const progress = Math.round(((i + 1) / attachments.length) * 100);
          await sseService.publishToSession(sessionId, {
            type: 'notification',
            scope: 'session',
            message: 'hybrid-search-progress',
            data: {
              title: `Progress: ${progress}%`,
              body: [`Processed ${i + 1} / ${attachments.length} attachments`] 
            },
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.warn('[HybridSearch] SSE progress publish failed', err);
        }
      }

      timer?.startTimer('ranking');
      const allHits = Array.from(hybridMap.values());

      const vectorRanks = allHits
        .filter((hit) => hit.vectorScore !== undefined)
        .sort((a, b) => (b.vectorScore ?? 0) - (a.vectorScore ?? 0));

      vectorRanks.forEach((hit, idx) => {
        const key = `${hit.attachmentId}:${hit.chunkIndex}`;
        const existing = hybridMap.get(key);
        if (existing) {
          existing.vectorRank = idx + 1;
          hybridMap.set(key, existing);
        }
      });

      const bm25Ranks = allHits
        .filter((hit) => hit.bm25Score !== undefined)
        .sort((a, b) => (b.bm25Score ?? 0) - (a.bm25Score ?? 0));

      bm25Ranks.forEach((hit, idx) => {
        const key = `${hit.attachmentId}:${hit.chunkIndex}`;
        const existing = hybridMap.get(key);
        if (existing) {
          existing.bm25Rank = idx + 1;
          hybridMap.set(key, existing);
        }
      });

      const k = 60;
      const fusedHits = Array.from(hybridMap.values())
        .map((hit) => ({
          ...hit,
          rrfScore:
            (hit.vectorRank ? 1 / (k + hit.vectorRank) : 0) +
            (hit.bm25Rank ? 1 / (k + hit.bm25Rank) : 0),
        }))
        .sort((a, b) => (b.rrfScore ?? 0) - (a.rrfScore ?? 0));

      const FINAL_HYBRID_K = Math.min(12, totalTopK);
      const topHits = fusedHits.slice(0, FINAL_HYBRID_K);
      timer?.endTimer('ranking');

      try {
        const rankingBody: string[] = [
          `Top ${topHits.length} hybrid-ranked chunks after RRF fusion:`,
          ...topHits.map((h, idx) =>
            `${idx + 1}. ${h.filename ?? 'file'} - chunk ${h.chunkIndex} - score ${(h.rrfScore ?? 0).toFixed(6)}`
          )
        ];

        await sseService.publishToSession(sessionId, {
          type: 'notification',
          scope: 'session',
          message: 'hybrid-ranking-complete',
          data: {
            title: 'Hybrid ranking complete',
            body: rankingBody
          },
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[HybridSearch] SSE publish failed for hybrid ranking', err);
      }

      timer?.startTimer('hydration');
      const hydratedHits = await Promise.all(
        topHits.map(async (hit) => {
          if (!hit.content || !hit.filename) {
            const chunk = await SearchService.getChunk(sessionId, hit.attachmentId, hit.chunkIndex);
            if (chunk) {
              hit.content = chunk.content;
              hit.filename = chunk.filename;
              hit.pageNumber = chunk.pageNumber;
            }
          }
          return hit;
        })
      );
      timer?.endTimer('hydration');

      if (timer) {
        const breakdown = timer.getMetrics().retrievalBreakdown || {};
        breakdown.vectorSearchMs = timer.getDuration('vectorSearch') || undefined;
        breakdown.bm25SearchMs = timer.getDuration('bm25Search') || undefined;
        breakdown.rankingMs = timer.getDuration('ranking') || undefined;
        breakdown.hydrationMs = timer.getDuration('hydration') || undefined;
        
        const vectorTimings = timer.getAttachmentTimings('vectorSearch');
        const bm25Timings = timer.getAttachmentTimings('bm25Search');
        
        breakdown.perAttachment = breakdown.perAttachment || {};
        for (const [attachmentId, duration] of Object.entries(vectorTimings)) {
          breakdown.perAttachment[attachmentId] = {
            ...breakdown.perAttachment[attachmentId],
            vectorSearchMs: duration,
          };
        }
        for (const [attachmentId, duration] of Object.entries(bm25Timings)) {
          breakdown.perAttachment[attachmentId] = {
            ...breakdown.perAttachment[attachmentId],
            bm25SearchMs: duration,
          };
        }
        
        timer.setRetrievalBreakdown(breakdown);
      }

      const validContexts: EnhancedContext[] = hydratedHits
        .filter((hit) => hit.content && hit.filename)
        .map((hit) => ({
          content: hit.content!,
          attachmentId: hit.attachmentId,
          filename: hit.filename!,
          chunkIndex: hit.chunkIndex,
          pageNumber: hit.pageNumber
        }));

      // final publish
      try {
        await sseService.publishToSession(sessionId, {
          type: 'success',
          scope: 'session',
          message: 'hybrid-search-complete',
          data: {
            title: 'Hybrid search complete',
            body: [
              `Retrieved ${validContexts.length} context chunks`,
              `Query: ${query}`,
              'Fusion: RRF (dense + BM25 ranked lists)'
            ]
          },
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[HybridSearch] SSE publish failed for final complete', err);
      }

      console.log(
        `[HybridSearch] Retrieved ${validContexts.length} hybrid-ranked context chunks from ${attachmentIds.length} attachments`
      );

      return validContexts;
    } catch (err) {
      // publish error to SSE and rethrow so upstream can handle
      try {
        await sseService.publishToSession('', {
          type: 'notification',
          scope: 'session',
          message: 'hybrid-search-error',
          data: {
            title: 'Hybrid search error',
            body: [err instanceof Error ? err.message : String(err)]
          },
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        // ignore SSE failures in error path
        console.error('[HybridSearch] Failed to publish error SSE', e);
      }

      throw err;
    }
  }
}
