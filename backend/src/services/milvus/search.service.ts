import { getMilvusClient } from './client';
import { EmbeddingService } from '../embedding.service';
import { CollectionService } from './collection.service';
import { Chunk } from '../chunking.service'

export interface SearchResult {
  content: string;
  attachmentId: string;
  filename: string;
  chunkIndex: number;
  pageNumber?: number;
  score: number;
  metadata?: any;
}

export class SearchService {
  static async search(
    sessionId: string,
    queryText: string,
    topK: number = 10,
    attachmentId?: string
  ): Promise<SearchResult[]> {
    try {
      const collectionName = CollectionService.generateCName(sessionId);
      const hasCollection = await CollectionService.hasCollection(collectionName);
      
      if (!hasCollection) {
        console.log(`[Milvus] No collection found for session: ${sessionId}`);
        return [];
      }
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
        attachmentId: result.metadata?.attachmentId || 'unknown',
        filename: result.metadata?.filename || 'unknown',
        chunkIndex: Number(result.chunk_index) || 0,
        pageNumber: result.metadata?.pageNumber,
        score: result.score,
        metadata: result.metadata,
      }));

      if (attachmentId) {
        results = results
          .filter((result) => result.attachmentId === attachmentId)
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

  static async getChunk(
    sessionId: string,
    attachmentId: string,
    chunkIndex: number
  ): Promise<SearchResult | null> {
    try {
      const collectionName = CollectionService.generateCName(sessionId);
      const hasCollection = await CollectionService.hasCollection(collectionName);
      
      if (!hasCollection) {
        console.log(`[Milvus] No collection found for session: ${sessionId}`);
        return null;
      }

      const client = getMilvusClient();

      const queryResults = await client.query({
        collection_name: collectionName,
        filter: `metadata["attachmentId"] == "${attachmentId}" && chunk_index == ${chunkIndex}`,
        output_fields: ['content', 'metadata', 'chunk_index'],
        limit: 1,
      });

      if (!queryResults.data || queryResults.data.length === 0) {
        return null;
      }

      const result = queryResults.data[0];
      return {
        content: result.content || '',
        attachmentId: result.metadata?.attachmentId || attachmentId,
        filename: result.metadata?.filename || 'unknown',
        chunkIndex: result.chunk_index || chunkIndex,
        pageNumber: result.metadata?.pageNumber,
        score: 0,
        metadata: result.metadata,
      };
    } catch (error) {
      console.error(`[Milvus] Failed to retrieve chunk ${chunkIndex} for attachment ${attachmentId}:`, error);
      return null;
    }
  }

  static async getAllChunks(
    sessionId: string,
    attachmentId: string
  ): Promise<Chunk[]> {
    try {
      const collectionName = CollectionService.generateCName(sessionId);
      const hasCollection = await CollectionService.hasCollection(collectionName);
      
      if (!hasCollection) {
        console.log(`[Milvus] No collection found for session: ${sessionId}`);
        return [];
      }

      const client = getMilvusClient();

      const queryResults = await client.query({
        collection_name: collectionName,
        filter: `metadata["attachmentId"] == "${attachmentId}"`,
        output_fields: ['chunk_index', 'content'],
      });

      const chunks: Chunk[] = queryResults.data.map((result: any) => ({
        content: result.content || '',
        index: result.chunk_index || 0,
        metadata: result.metadata,
      }));

      chunks.sort((a, b) => a.index - b.index);

      console.log(`[Milvus] Retrieved ${chunks.length} chunks for attachment ${attachmentId}`);
      return chunks;
    } catch (error) {
      console.error(`[Milvus] Failed to retrieve chunks for attachment ${attachmentId}:`, error);
      return [];
    }
  }
}
