import { SearchService, SearchResult } from '../file-processing/milvus';
import { dynamicTopK } from '../../config/rag.config';

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
    attachmentIds?: string[]
  ): Promise<EnhancedContext[]> {
    try {
      // If no attachments specified, return empty context
      if (!attachmentIds || attachmentIds.length === 0) {
        console.log(`[Retrieval] No attachments specified, returning empty context`);
        return [];
      }

      // Calculate optimal topK based on number of attachments
      const totalTopK = dynamicTopK(attachmentIds.length);
      const topKPerDoc = Math.ceil(totalTopK / attachmentIds.length);

      console.log(
        `[Retrieval] Searching ${attachmentIds.length} attachment(s) with topK=${totalTopK} (${topKPerDoc} per doc)`
      );

      // Search each attachment in parallel
      const promises = attachmentIds.map((attachmentId) =>
        SearchService.search(sessionId, query, topKPerDoc, attachmentId)
      );
      const resultsArray = await Promise.all(promises);
      const allResults: SearchResult[] = resultsArray.flat();

      // Sort by score and take top K overall
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
    } catch (error) {
      console.error(`[Retrieval] Error getting context for session ${sessionId}:`, error);
      return [];
    }
  }
}

