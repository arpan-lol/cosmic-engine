import { Embedding } from './embedding.service';

export class VectorStoreService {

  static async storeVectors(
    attachmentId: string,
    embeddings: Embedding[]
  ): Promise<void> {
    throw new Error('Not implemented');
  }


  static async getVectors(attachmentId: string): Promise<Embedding[]> {
    throw new Error('Not implemented');
  }

  static async deleteVectors(attachmentId: string): Promise<void> {
    throw new Error('Not implemented');
  }

  static async search(
    sessionId: string,
    queryVector: number[],
    topK: number = 5
  ): Promise<Embedding[]> {
    throw new Error('Not implemented');
  }
}

