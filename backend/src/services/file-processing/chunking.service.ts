export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

export interface Chunk {
  content: string;
  index: number;
  metadata?: Record<string, any>;
}

export class ChunkingService {
  /**
   * Chunk markdown content into smaller pieces
   */
  static async chunkContent(
    markdown: string,
    options: ChunkOptions = {}
  ): Promise<Chunk[]> {
    throw new Error('Not implemented');
  }
}

