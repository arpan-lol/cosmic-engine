import { SearchService, SearchResult } from '../milvus';
import { dynamicTopK } from '../../config/rag.config';
import { RetrievalOptions } from '../../types/chat.types';
import { HybridSearchService } from '../features/search-strategies/hybrid-search.service';
import { AppError } from 'src/types/errors';
import { sseService } from '../sse.service';
import { logger } from '@zilliz/milvus2-sdk-node';

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
    options?: RetrievalOptions
  ): Promise<EnhancedContext[]> {
    try {
      if (!attachmentIds || attachmentIds.length === 0) {
        console.log(`[Retrieval] No attachments specified, returning empty context`);
        return [];
      }

      if (options?.bm25) {
        console.log(`[Retrieval] Using hybrid search (BM25 + Vector) for ${attachmentIds.length} attachment(s)`);
        return await HybridSearchService.search(sessionId, query, attachmentIds);
      }

      const ctx = await this.vectorSearch(sessionId, query, attachmentIds);

      await sseService.publishToSession(sessionId, {
        type: 'success',
        scope: 'session',
        message: 'vector-search-complete',
        showInChat: false,
        data: {
          title: 'Vector search complete',
          body: [
            `Found ${ctx.length} relevant chunks`,
            ...ctx.slice(0, 3).map(c => `${c.filename} • chunk ${c.chunkIndex + 1}`)
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
        showInChat: false,
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
    attachmentIds: string[]
  ): Promise<EnhancedContext[]> {
    const totalTopK = dynamicTopK(attachmentIds.length);
    const topKPerDoc = Math.ceil(totalTopK / attachmentIds.length);

    console.log(
      `[Retrieval] Vector search on ${attachmentIds.length} attachment(s) with topK=${totalTopK} (${topKPerDoc} per doc)`
    );

    const promises = attachmentIds.map((attachmentId) =>
      SearchService.search(sessionId, query, topKPerDoc, attachmentId)
    );
    const resultsArray = await Promise.all(promises);
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

