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
      console.log(`Collection ${collectionName} already exists, ensuring index and load state...`);
      
      try {
        await client.loadCollection({
          collection_name: collectionName,
        });
        console.log(`Collection ${collectionName} loaded successfully`);
      } catch (error: any) {
        if (error.message?.includes('IndexNotExist')) {
          console.log(`Index missing for ${collectionName}, recreating index...`);
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
          await client.loadCollection({
            collection_name: collectionName,
          });
          console.log(`Index recreated and collection loaded for ${collectionName}`);
        } else {
          console.log(`Collection ${collectionName} already loaded or error:`, error.message);
        }
      }
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
      index_type: 'HNSW',
      metric_type: 'COSINE',
      params: {
        M: 32,
        efConstruction: 300
      }
    });

    await client.loadCollection({
      collection_name: collectionName,
    });

    console.log(`Collection ${collectionName} created and loaded successfully`);
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

}
