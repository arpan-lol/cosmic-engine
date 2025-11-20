import { SearchService } from '../file-processing/milvus';

export class RetrievalService {
  static async getRelevantContext(
    sessionId: string,
    query: string,
    topK: number = 10,
    attachmentIds?: string[]
  ): Promise<string[]> {
    try {
      // If attachmentIds are provided, search within those specific attachments and combine results
      if (attachmentIds && attachmentIds.length > 0) {
        const allResults: Array<{ content: string; metadata: any; score: number }> = [];
        
        // Search each attachment in parallel
        const promises = attachmentIds.map(attachmentId => 
          SearchService.search(sessionId, query, topK, attachmentId)
        );
        const resultsArray = await Promise.all(promises);
        allResults.push(...resultsArray.flat());

        // Sort by score and take top K overall
        const topResults = allResults.sort((a, b) => b.score - a.score).slice(0, topK);
        
        console.log(`[Retrieval] Retrieved ${topResults.length} context chunks from ${attachmentIds.length} attachments`);
        return topResults.map((r) => r.content);
      }
      
      console.log(`[Retrieval] No attachments specified, returning empty context`);
      return [];
    } catch (error) {
      console.error(`[Retrieval] Error getting context for session ${sessionId}:`, error);
      return [];
    }
  }
}

