import { SearchService } from '../file-processing/milvus';

export class RetrievalService {
  static async getRelevantContext(
    sessionId: string,
    query: string,
    topK: number = 5,
    documentIds?: string[]
  ): Promise<string[]> {
    try {
      // If documentIds are provided, search each document and combine results
      if (documentIds && documentIds.length > 0) {
        const allResults: Array<{ content: string; metadata: any; score: number }> = [];
        
        for (const docId of documentIds) {
          const docResults = await SearchService.search(sessionId, query, topK, docId);
          allResults.push(...docResults);
        }
        
        // Sort by score and take top K overall
        allResults.sort((a, b) => b.score - a.score);
        const topResults = allResults.slice(0, topK);
        
        console.log(`[Retrieval] Retrieved ${topResults.length} context chunks from ${documentIds.length} documents`);
        return topResults.map((r) => r.content);
      }
      
      // Default behavior: search across entire session
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

