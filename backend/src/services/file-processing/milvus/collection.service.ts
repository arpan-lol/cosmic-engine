import { getMilvusClient } from './client';
import { DataType } from '@zilliz/milvus2-sdk-node';

const EMBEDDING_DIMENSION = 768;

export class CollectionService {
  static generateCName(sessionId: string): string {
    return `session_${sessionId.replace(/-/g, '_')}`;
  }

  static async initializeCollection(collectionName: string): Promise<void> {
    const client = getMilvusClient();
    
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

    console.log(`Collection ${collectionName} created successfully`);
  }

  static async deleteCollection(collectionName: string): Promise<void> {
    const client = getMilvusClient();
    await client.dropCollection({
      collection_name: collectionName,
    });
    console.log(`Collection ${collectionName} deleted`);
  }

  static async hasCollection(collectionName: string): Promise<boolean> {
    const client = getMilvusClient();
    
    try {
      const result = await client.hasCollection({
        collection_name: collectionName,
      });
      return !!result.value;
    } catch (error) {
      console.error(`Error checking collection existence:`, error);
      return false;
    }
  }

  static async getCollectionStats(collectionName: string): Promise<{
    totalVectors: number;
    collectionExists: boolean;
  }> {
    const client = getMilvusClient();
    
    try {
      const exists = await this.hasCollection(collectionName);
      
      if (!exists) {
        return { totalVectors: 0, collectionExists: false };
      }

      const stats = await client.getCollectionStatistics({
        collection_name: collectionName,
      });

      return {
        totalVectors: parseInt(stats.data.row_count || '0'),
        collectionExists: true,
      };
    } catch (error) {
      console.error(`Error getting collection stats:`, error);
      return { totalVectors: 0, collectionExists: false };
    }
  }

  static async buildIndexAndLoad(collectionName: string): Promise<void> {
    const client = getMilvusClient();

    console.log(`[Milvus] Building index for ${collectionName}...`);

    const indexInfo = await client.describeIndex({ collection_name: collectionName });
    
    if (!indexInfo.index_descriptions || indexInfo.index_descriptions.length === 0) {
      await client.createIndex({
        collection_name: collectionName,
        field_name: 'vector',
        index_type: 'HNSW',
        metric_type: 'COSINE',
        params: {
          M: 32,
          efConstruction: 300
        }
      });
      console.log(`[Milvus] Index created for ${collectionName}`);
    } else {
      console.log(`[Milvus] Index already exists for ${collectionName}`);
    }

    try {
      await client.loadCollection({
        collection_name: collectionName,
      });
      console.log(`[Milvus] Collection ${collectionName} loaded successfully`);
    } catch (error: any) {
      if (error.message?.includes('already loaded')) {
        console.log(`[Milvus] Collection ${collectionName} already loaded`);
      } else {
        throw error;
      }
    }
  }

}
