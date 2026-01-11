import { MilvusClient } from '@zilliz/milvus2-sdk-node';

const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'milvus:19530';

let milvusClient: MilvusClient | null = null;
let connectionPromise: Promise<void> | null = null;

export function getMilvusClient(): MilvusClient {
  if (!milvusClient) {
    console.log(`[Milvus] Initializing client with address: ${MILVUS_ADDRESS}`);
    
    milvusClient = new MilvusClient({
      address: MILVUS_ADDRESS,
      timeout: 60000,
      maxRetries: 5,
      retryDelay: 2000,
    });

    connectionPromise = milvusClient.connectPromise
      .then(() => {
        console.log(`[Milvus] ✅ Successfully connected to ${MILVUS_ADDRESS}`);
      })
      .catch((error) => {
        console.error(`[Milvus] ❌ Failed to connect to ${MILVUS_ADDRESS}:`, error.message);
        throw error;
      });
  }
  return milvusClient;
}

export async function ensureConnection(): Promise<void> {
  getMilvusClient();
  if (connectionPromise) {
    await connectionPromise;
  }
}
