import { Chunk } from './chunking.service';
import { GoogleGenAI } from '@google/genai';
import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';

export interface Embedding {
  chunkIndex: number;
  vector: number[];
  content: string;
  metadata?: Record<string, any>;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'localhost:19530';
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_DIMENSION = 768; 

export class EmbeddingService {
  private static milvusClient: MilvusClient | null = null;

  private static getMilvusClient(): MilvusClient {
    if (!this.milvusClient) {
      this.milvusClient = new MilvusClient({
        address: MILVUS_ADDRESS,
      });
    }
    return this.milvusClient;
  }


  static async initializeCollection(collectionName: string): Promise<void> {
    const client = this.getMilvusClient();
    // Check if collection exists
    const hasCollection = await client.hasCollection({
      collection_name: collectionName,
    });

    if (hasCollection.value) {
      console.log(`Collection ${collectionName} already exists`);
      return;
    }

    const schema = [
      {
        name: 'id',
        description: 'Primary key',
        data_type: DataType.Int64,
        is_primary_key: true,
        autoID: true,
      },
      {
        name: 'chunk_index',
        description: 'Index of the chunk in the original document',
        data_type: DataType.Int64,
      },
      {
        name: 'content',
        description: 'Text content of the chunk',
        data_type: DataType.VarChar,
        max_length: 65535,
      },
      {
        name: 'metadata',
        description: 'JSON metadata for the chunk',
        data_type: DataType.JSON,
      },
      {
        name: 'vector',
        description: 'Embedding vector',
        data_type: DataType.FloatVector,
        dim: EMBEDDING_DIMENSION,
      },
    ];

    await client.createCollection({
      collection_name: collectionName,
      fields: schema,
      enableDynamicField: true,
    });

    await client.createIndex({
      collection_name: collectionName,
      field_name: 'vector',
      index_type: 'IVF_FLAT',
      metric_type: 'COSINE',
      params: { nlist: 128 },
    });

    await client.loadCollection({
      collection_name: collectionName,
    });

    console.log(`Collection ${collectionName} created and loaded successfully`);
  }


  static async generateEmbeddings(chunks: Chunk[]): Promise<Embedding[]> {
    if (chunks.length === 0) {
      return [];
    }

    const texts = chunks.map((chunk) => chunk.content);

    try {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: texts,
        config: { taskType: 'RETRIEVAL_DOCUMENT'},
      });

      if (!response.embeddings || response.embeddings.length === 0) {
        throw new Error('No embeddings returned from API');
      }

      // Map response to Embedding interface
      const embeddings: Embedding[] = chunks.map((chunk, index) => {
        const values = response.embeddings![index].values;
        if (!values) {
          throw new Error(`No embedding values for chunk ${index}`);
        }
        return {
          chunkIndex: chunk.index,
          vector: values,
          content: chunk.content,
          metadata: chunk.metadata || {},
        };
      });

      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  static async storeEmbeddings(
    collectionName: string,
    embeddings: Embedding[]
  ): Promise<void> {
    if (embeddings.length === 0) {
      return;
    }

    const client = this.getMilvusClient();

    const data = embeddings.map((embedding) => ({
      chunk_index: embedding.chunkIndex,
      content: embedding.content,
      metadata: embedding.metadata || {},
      vector: embedding.vector,
    }));

    await client.insert({
      collection_name: collectionName,
      data: data,
    });

    console.log(`Inserted ${embeddings.length} embeddings into ${collectionName}`);
  }


  static async semanticSearch(
    collectionName: string,
    queryText: string,
    topK: number = 10
  ): Promise<Array<{ content: string; metadata: any; score: number }>> {
    const client = this.getMilvusClient();

    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: [queryText],
      config: { taskType: 'RETRIEVAL_QUERY'}, 
    });

    if (!response.embeddings || !response.embeddings[0]?.values) {
      throw new Error('No embeddings returned for query');
    }

    const queryVector = response.embeddings[0].values;

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

  /**
   * Delete a collection
   */
  static async deleteCollection(collectionName: string): Promise<void> {
    const client = this.getMilvusClient();
    await client.dropCollection({
      collection_name: collectionName,
    });
    console.log(`Collection ${collectionName} deleted`);
  }
}

