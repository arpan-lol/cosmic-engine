import { MilvusClient } from '@zilliz/milvus2-sdk-node';

const MILVUS_ADDRESS = process.env.MILVUS_ADDRESS || 'milvus:19530';

let milvusClient: MilvusClient | null = null;

export function getMilvusClient(): MilvusClient {
  if (!milvusClient) {
    milvusClient = new MilvusClient({
      address: MILVUS_ADDRESS,
    });
  }
  return milvusClient;
}
