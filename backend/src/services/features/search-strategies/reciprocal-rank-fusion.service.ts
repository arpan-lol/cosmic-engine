import { EnhancedContext } from '../../llm/retrieval.service';
import { BM25Search } from './bm25-search.service';
import { SearchService } from '../../milvus/index';
import { dynamicTopK } from '../../../config/rag.config';
import prisma from 'src/prisma/client';
import { NotFoundError, ValidationError } from 'src/types/errors';
import { sseService } from 'src/services/sse.service';

interface RRFHit {
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

export class ReciprocalRankFusionService {
  static async search(
    sessionId: string,
    query: string,
    attachmentIds: string[]
  ): Promise<EnhancedContext[]> {
    try {
      const totalTopK = dynamicTopK(attachmentIds.length);
      const topKPerDoc = Math.ceil(totalTopK / Math.max(1, attachmentIds.length));

      const attachments = await prisma.attachment.findMany({
        where: { id: { in: attachmentIds } }
      });

      if (attachments.length !== attachmentIds.length) {
        const foundIds = new Set(attachments.map((a: any) => a.id));
        const missing = attachmentIds.filter((id) => !foundIds.has(id));
        throw new NotFoundError(`Missing attachments: ${missing.join(', ')}`);
      }

      const notCompleted = attachments.filter((a: any) => a.bm25indexStatus !== 'completed');
      if (notCompleted.length) {
        const list = notCompleted.map((a: any) => `${a.id}:${a.bm25indexStatus}`).join(', ');
        throw new ValidationError(
          `All files must be BM25 indexed before using RRF. Problematic files: ${list}`
        );
      }

      await sseService.publishToSession(sessionId, {
        type: 'notification',
        scope: 'session',
        message: 'rrf-started',
        data: {
          title: 'RRF search started',
          body: [`Query: ${query}`, `Attachments: ${attachmentIds.length}`, `topK: ${totalTopK}`]
        },
        timestamp: new Date().toISOString()
      });

      const map = new Map<string, RRFHit>();

      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i] as any;
        const attachmentId = att.id as string;

        const [vecHits, bmData] = await Promise.all([
          SearchService.search(sessionId, query, topKPerDoc, attachmentId),
          BM25Search.search(attachmentId, query, topKPerDoc)
        ]);

        try {
          const vecPreview = (vecHits || []).slice(0, 3).map((h: any) =>
            `Chunk ${h.chunkIndex + 1}: ${(h.score ?? 0).toFixed(3)}${h.filename ? ` (${h.filename})` : ''}`
          );

          const bmTerms = (bmData.rows || []).slice(0, 5).map((r: any) =>
            `"${r.term}" tf:${r.tf} df:${r.df}`
          );

          const bmScores = Object.entries(bmData.scores || {})
            .slice(0, 5)
            .map(([chunkIndex, score]) => `Chunk ${Number(chunkIndex) + 1}: ${(score as number).toFixed(3)}`);

          const body: string[] = [
            `Attachment: ${att.filename ?? attachmentId}`,
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
            message: 'rrf-attachment-complete',
            attachmentId,
            data: {
              title: `Search results for ${att.filename ?? attachmentId}`,
              body
            },
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.warn('[RRF] SSE publish failed for attachment', attachmentId, err);
        }

        (vecHits || []).forEach((h: any, idx: number) => {
          const key = `${h.attachmentId}:${h.chunkIndex}`;
          let existing = map.get(key) as RRFHit | undefined;
          if (!existing) {
            existing = { attachmentId: h.attachmentId, chunkIndex: h.chunkIndex };
          }
          existing.vectorRank = idx + 1;
          existing.vectorScore = h.score;
          existing.content = existing.content ?? h.content;
          existing.filename = existing.filename ?? h.filename;
          existing.pageNumber = existing.pageNumber ?? h.pageNumber;
          map.set(key, existing);
        });

        const bmHits = bmData.data || [];
        bmHits.forEach((hit: any) => {
          const key = `${attachmentId}:${hit.chunkIndex}`;
          let existing = map.get(key) as RRFHit | undefined;
          if (!existing) {
            existing = { attachmentId, chunkIndex: hit.chunkIndex };
          }
          existing.bm25Score = hit.score;
          map.set(key, existing);
        });

        try {
          const progress = Math.round(((i + 1) / attachments.length) * 100);
          await sseService.publishToSession(sessionId, {
            type: 'notification',
            scope: 'session',
            message: 'rrf-progress',
            attachmentId,
            data: {
              title: `Progress: ${progress}%`,
              body: [`Processed ${i + 1} / ${attachments.length} attachments`]
            },
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.warn('[RRF] SSE progress publish failed', err);
        }
      }

      const bm25RanksArray = Array.from(map.values())
        .filter((h) => h.bm25Score !== undefined)
        .sort((a, b) => (b.bm25Score ?? 0) - (a.bm25Score ?? 0));

      bm25RanksArray.forEach((h, idx) => {
        const key = `${h.attachmentId}:${h.chunkIndex}`;
        const existing = map.get(key);
        if (existing) {
          existing.bm25Rank = idx + 1;
          map.set(key, existing);
        }
      });

      const vectorRanksArray = Array.from(map.values())
        .filter((h) => h.vectorScore !== undefined)
        .sort((a, b) => (a.vectorRank ?? Infinity) - (b.vectorRank ?? Infinity));

      vectorRanksArray.forEach((h) => {
        const key = `${h.attachmentId}:${h.chunkIndex}`;
        const existing = map.get(key);
        if (existing && existing.vectorRank === undefined) {
          existing.vectorRank = vectorRanksArray.indexOf(h) + 1;
          map.set(key, existing);
        }
      });

      const k = 60;
      const fused = Array.from(map.values()).map((h) => {
        const rrf =
          (h.vectorRank ? 1 / (k + h.vectorRank) : 0) +
          (h.bm25Rank ? 1 / (k + h.bm25Rank) : 0);
        return { ...h, rrfScore: rrf };
      });

      fused.sort((a, b) => (b.rrfScore ?? 0) - (a.rrfScore ?? 0));

      const FINAL_K = Math.min(12, totalTopK);
      const top = fused.slice(0, FINAL_K);

      try {
        const previewBody: string[] = [
          `Top ${top.length} RRF-ranked chunks:`,
          ...top.map((t, i) =>
            `${i + 1}. ${t.filename ?? t.attachmentId} - chunk ${t.chunkIndex + 1} - score ${(t.rrfScore ?? 0).toFixed(6)}`
          )
        ];

        await sseService.publishToSession(sessionId, {
          type: 'notification',
          scope: 'session',
          message: 'rrf-fusion-complete',
          data: {
            title: 'RRF fusion complete',
            body: previewBody
          },
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[RRF] SSE publish failed for fusion preview', err);
      }

      const hydrated = await Promise.all(
        top.map(async (t) => {
          if (!t.content || !t.filename) {
            const chunk = await SearchService.getChunk(sessionId, t.attachmentId, t.chunkIndex);
            if (chunk) {
              t.content = chunk.content;
              t.filename = chunk.filename;
              t.pageNumber = chunk.pageNumber;
            }
          }
          return t;
        })
      );

      const valid: EnhancedContext[] = hydrated
        .filter((h) => h.content && h.filename)
        .map((h) => ({
          content: h.content!,
          attachmentId: h.attachmentId,
          filename: h.filename!,
          chunkIndex: h.chunkIndex,
          pageNumber: h.pageNumber
        }));

      try {
        await sseService.publishToSession(sessionId, {
          type: 'success',
          scope: 'session',
          message: 'rrf-complete',
          data: {
            title: 'RRF search complete',
            body: [
              `Retrieved ${valid.length} context chunks`,
              `Query: ${query}`
            ]
          },
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[RRF] SSE publish failed for final complete', err);
      }

      return valid;
    } catch (err) {
      try {
        await sseService.publishToSession(sessionId, {
          type: 'notification',
          scope: 'session',
          message: 'rrf-error',
          data: {
            title: 'RRF search error',
            body: [err instanceof Error ? err.message : String(err)]
          },
          timestamp: new Date().toISOString()
        });
      } catch (e) {
        console.error('[RRF] Failed to publish error SSE', e);
      }
      throw err;
    }
  }
}