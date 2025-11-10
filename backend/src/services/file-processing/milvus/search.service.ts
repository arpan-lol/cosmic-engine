import { getMilvusClient } from './client';
import { EmbeddingService } from '../embedding.service';
import { CollectionService } from './collection.service';

export class SearchService {
  static async search(
    sessionId: string,
    queryText: string,
    topK: number = 10,
    attachmentId?: string
  ): Promise<Array<{ content: string; metadata: any; score: number }>> {
    try {
      const hasCollection = await CollectionService.hasCollection(sessionId);
      
      if (!hasCollection) {
        console.log(`[Milvus] No collection found for session: ${sessionId}`);
        return [];
      }

      const collectionName = CollectionService.generateCName(sessionId);
      const client = getMilvusClient();
      
      const queryVector = await EmbeddingService.generateQueryEmbedding(queryText);

      const searchResults = await client.search({
        collection_name: collectionName,
        data: [queryVector],
        limit: attachmentId ? topK * 3 : topK,
        output_fields: ['content', 'metadata', 'chunk_index'],
      });

      let results = searchResults.results.map((result: any) => ({
        content: result.content,
        metadata: result.metadata,
        score: result.score,
      }));

      if (attachmentId) {
        results = results
          .filter((result) => result.metadata?.attachmentId === attachmentId)
          .slice(0, topK);
        console.log(`[Milvus] Found ${results.length} results in attachment ${attachmentId}`);
      } else {
        console.log(`[Milvus] Found ${results.length} results for query in session ${sessionId}`);
      }

      return results;
    } catch (error) {
      console.error(`[Milvus] Search failed in session ${sessionId}:`, error);
      return [];
    }
  }

  static async getContext(
    sessionId: string,
    query: string,
    topK: number = 10
  ): Promise<string[]> {
    const results = await this.search(sessionId, query, topK);
    return results.map((result) => result.content);
  }
}
