import { SearchService, SearchResult } from '../milvus';
import { dynamicTopK } from '../../config/rag.config';
import { RetrievalOptions } from '../../types/chat.types';
import { HybridSearchService } from '../features/search-strategies/hybrid-search.service';

export interface EnhancedContext {
  content: string;
  attachmentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
}

export class RetrievalService {
  static async getRelevantContext(
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

      return await this.vectorSearch(sessionId, query, attachmentIds);
    } catch (error) {
      console.error(`[Retrieval] Error getting context for session ${sessionId}:`, error);
      return [];
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

