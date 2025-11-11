import { SearchService } from '../file-processing/milvus';

export class RetrievalService {
  static async getRelevantContext(
    sessionId: string,
    query: string,
    topK: number = 5
  ): Promise<string[]> {
    try {
      const results = await SearchService.search(sessionId, query, topK);
      const context = results.map((r) => r.content);
      
      console.log(`[Retrieval] Retrieved ${context.length} context chunks for session ${sessionId}`);
      return context;
    } catch (error) {
      console.error(`[Retrieval] Error getting context for session ${sessionId}:`, error);
      return [];
    }
  }
}

