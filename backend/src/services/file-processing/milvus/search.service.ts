import { getMilvusClient } from './client';
import { EmbeddingService } from '../embedding.service';
import { CollectionService } from './collection.service';

export class SearchService {
  static async searchInSession(
    sessionId: string,
    queryText: string,
    topK: number = 10
  ): Promise<Array<{ content: string; metadata: any; score: number }>> {
    const collectionName = CollectionService.generateCName(sessionId);
    
    try {
      const results = await this.semanticSearch(
        collectionName,
        queryText,
        topK
      );
      
      console.log(
        `[Milvus] Found ${results.length} results for query in session ${sessionId}`
      );
      
      return results;
    } catch (error) {
      console.error(`[Milvus] Search failed in session ${sessionId}:`, error);
      throw error;
    }
  }

  static async searchInAttachment(
    sessionId: string,
    attachmentId: string,
    queryText: string,
    topK: number = 5
  ): Promise<Array<{ content: string; metadata: any; score: number }>> {
    const collectionName = CollectionService.generateCName(sessionId);
    
    try {
      const allResults = await this.semanticSearch(
        collectionName,
        queryText,
        topK * 3
      );
      
      const filtered = allResults
        .filter((result) => result.metadata?.attachmentId === attachmentId)
        .slice(0, topK);
      
      console.log(
        `[Milvus] Found ${filtered.length} results in attachment ${attachmentId}`
      );
      
      return filtered;
    } catch (error) {
      console.error(`[Milvus] Search failed in attachment ${attachmentId}:`, error);
      throw error;
    }
  }

  static async semanticSearch(
    collectionName: string,
    queryText: string,
    topK: number = 10
  ): Promise<Array<{ content: string; metadata: any; score: number }>> {
    const client = getMilvusClient();

    const queryVector = await EmbeddingService.generateQueryEmbedding(queryText);

    const searchResults = await client.search({
      collection_name: collectionName,
      data: [queryVector],
      limit: topK,
      output_fields: ['content', 'metadata', 'chunk_index'],
    });

    return searchResults.results.map((result: any) => ({
      content: result.content,
      metadata: result.metadata,
      score: result.score,
    }));
  }
}
