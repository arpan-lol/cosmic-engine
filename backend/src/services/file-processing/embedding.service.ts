import { Chunk } from './chunking.service';

export interface Embedding {
  chunkIndex: number;
  vector: number[];
  content: string;
  metadata?: Record<string, any>;
}

export class EmbeddingService {

  static async generateEmbeddings(chunks: Chunk[]): Promise<Embedding[]> {
    throw new Error('Not implemented');
  }
}

