import { Chunk } from '../chunking.service';
import { GoogleGenAI } from '@google/genai';
import { logger } from '../../utils/logger.util';
import { isGeminiError, parseGeminiError, ProcessingError } from '../../types/errors';

export interface Embedding {
  chunkIndex: number;
  vector: number[];
  content: string;
  metadata?: Record<string, any>;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const EMBEDDING_MODEL = 'text-embedding-004';

export class EmbeddingService {
  static async *generateEmbeddingsStream(
    chunkStream: AsyncGenerator<Chunk>
  ): AsyncGenerator<Embedding> {
    const BATCH_SIZE = 10;
    let batch: Chunk[] = [];

    for await (const chunk of chunkStream) {
      batch.push(chunk);

      if (batch.length >= BATCH_SIZE) {
        const embeddings = await this.generateEmbeddings(batch);
        for (const embedding of embeddings) {
          yield embedding;
        }
        batch = [];
      }
    }

    if (batch.length > 0) {
      const embeddings = await this.generateEmbeddings(batch);
      for (const embedding of embeddings) {
        yield embedding;
      }
    }
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
        logger.error('Embedding', 'No embeddings returned from API', undefined, { chunkCount: chunks.length });
        throw new ProcessingError('No embeddings returned from API');
      }

      const embeddings: Embedding[] = chunks.map((chunk, index) => {
        const values = response.embeddings![index].values;
        if (!values) {
          logger.error('Embedding', `No embedding values for chunk ${index}`, undefined, { chunkIndex: chunk.index });
          throw new ProcessingError(`No embedding values for chunk ${index}`);
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
      logger.error('Embedding', 'Error generating embeddings', error instanceof Error ? error : undefined, { chunkCount: chunks.length });
      
      if (isGeminiError(error)) {
        throw parseGeminiError(error);
      }
      
      if (error instanceof ProcessingError) {
        throw error;
      }
      
      throw new ProcessingError(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateQueryEmbedding(queryText: string): Promise<number[]> {
    try {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: [queryText],
        config: { taskType: 'RETRIEVAL_QUERY'},
      });

      if (!response.embeddings || !response.embeddings[0]?.values) {
        logger.error('Embedding', 'No embeddings returned for query', undefined, { queryLength: queryText.length });
        throw new ProcessingError('No embeddings returned for query');
      }

      return response.embeddings[0].values;
    } catch (error) {
      logger.error('Embedding', 'Error generating query embedding', error instanceof Error ? error : undefined, { queryLength: queryText.length });
      
      if (isGeminiError(error)) {
        throw parseGeminiError(error);
      }
      
      if (error instanceof ProcessingError) {
        throw error;
      }
      
      throw new ProcessingError(`Failed to generate query embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

