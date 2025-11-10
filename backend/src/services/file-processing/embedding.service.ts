import { Chunk } from './chunking.service';
import { GoogleGenAI } from '@google/genai';

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

  static async generateQueryEmbedding(queryText: string): Promise<number[]> {
    try {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: [queryText],
        config: { taskType: 'RETRIEVAL_QUERY'},
      });

      if (!response.embeddings || !response.embeddings[0]?.values) {
        throw new Error('No embeddings returned for query');
      }

      return response.embeddings[0].values;
    } catch (error) {
      console.error('Error generating query embedding:', error);
      throw new Error(`Failed to generate query embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

