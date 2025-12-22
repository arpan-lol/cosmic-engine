import { SearchService, SearchResult } from '../milvus';
import { dynamicTopK } from '../../config/rag.config';
import { RetrievalOptions } from '../../types/chat.types';
import { HybridSearchService } from '../features/search-strategies/hybrid-search.service';
import { ReciprocalRankFusionService } from '../features/search-strategies/reciprocal-rank-fusion.service';
import { sseService } from '../sse.service';
import { logger } from '@zilliz/milvus2-sdk-node';
import { PerformanceTracker } from '../../utils/timer.util';

export interface EnhancedContext {
  content: string;
  attachmentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
}

export class RetrievalService {
  static async getContext(
    sessionId: string,
    query: string,
    attachmentIds?: string[],
    options?: RetrievalOptions,
    timer?: PerformanceTracker
  ): Promise<EnhancedContext[]> {
    try {
      if (!attachmentIds || attachmentIds.length === 0) {
        console.log(`[Retrieval] No attachments specified, returning empty context`);
        return [];
      }

      if (options?.rrf) {
        console.log('[Retrieval] Using RRF fusion for retrieval');
        return await ReciprocalRankFusionService.search(sessionId, query, attachmentIds, timer);
      }

      if (options?.bm25) {
        console.log(`[Retrieval] Using hybrid search (BM25 + Vector) for ${attachmentIds.length} attachment(s)`);
        return await HybridSearchService.search(sessionId, query, attachmentIds, timer);
      }

      const ctx = await this.vectorSearch(sessionId, query, attachmentIds, timer);

      await sseService.publishToSession(sessionId, {
        type: 'success',
        scope: 'session',
        message: 'vector-search-complete',
        data: {
          title: 'Vector search complete',
          body: [
            `Found ${ctx.length} relevant chunks`,
            ...ctx.slice(0, 3).map(c => `${c.filename} • chunk ${c.chunkIndex}`)
          ],
        },
        timestamp: new Date().toISOString(),
      });

      return ctx;
    } catch (error) {
      console.error(`[Retrieval] Error getting context for session ${sessionId}:`, error);
      logger.error(`[Retrieval] Error getting context for session ${sessionId}:`, error);
      
      await sseService.publishToSession(sessionId, {
        type: 'notification',
        scope: 'session',
        message: 'retrieval-error',
        data: {
          title: 'Retrieval failed',
          body: [error instanceof Error ? error.message : String(error)],
        },
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  private static async vectorSearch(
    sessionId: string,
    query: string,
    attachmentIds: string[],
    timer?: PerformanceTracker
  ): Promise<EnhancedContext[]> {
    const totalTopK = dynamicTopK(attachmentIds.length);
    const topKPerDoc = Math.ceil(totalTopK / attachmentIds.length);

    console.log(
      `[Retrieval] Vector search on ${attachmentIds.length} attachment(s) with topK=${totalTopK} (${topKPerDoc} per doc)`
    );

    timer?.startTimer('vectorSearch');
    
    const promises = attachmentIds.map((attachmentId) => {
      timer?.startAttachmentTimer('vectorSearch', attachmentId);
      return SearchService.search(sessionId, query, topKPerDoc, attachmentId).then(results => {
        timer?.endAttachmentTimer('vectorSearch', attachmentId);
        return results;
      });
    });
    const resultsArray = await Promise.all(promises);
    timer?.endTimer('vectorSearch');
    
    const perAttachmentTimings = timer?.getAttachmentTimings('vectorSearch');
    if (timer && perAttachmentTimings) {
      const breakdown = timer.getMetrics().retrievalBreakdown || {};
      breakdown.vectorSearchMs = timer.getDuration('vectorSearch') || undefined;
      breakdown.perAttachment = breakdown.perAttachment || {};
      for (const [attachmentId, duration] of Object.entries(perAttachmentTimings)) {
        breakdown.perAttachment[attachmentId] = {
          ...breakdown.perAttachment[attachmentId],
          vectorSearchMs: duration,
        };
      }
      timer.setRetrievalBreakdown(breakdown);
    }
    
    const allResults: SearchResult[] = resultsArray.flat();

    const topResults = allResults.sort((a, b) => b.score - a.score).slice(0, totalTopK);

    console.log(
      `[Retrieval] Retrieved ${topResults.length} context chunks from ${attachmentIds.length} attachments`
    );

    return topResults.map((r) => ({
      content: r.content,
      attachmentId: r.attachmentId,
      filename: r.filename,
      chunkIndex: r.chunkIndex,
      pageNumber: r.pageNumber,
    }));
  }
}