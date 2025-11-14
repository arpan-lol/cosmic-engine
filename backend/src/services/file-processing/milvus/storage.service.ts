import { getMilvusClient } from './client';
import { Embedding } from '../embedding.service';
import { CollectionService } from './collection.service';

export class StorageService {
  static async *storeVectorsStream(
    sessionId: string,
    attachmentId: string,
    embeddingStream: AsyncGenerator<Embedding>
  ): AsyncGenerator<number> {
    const collectionName = CollectionService.generateCName(sessionId);
    const BATCH_SIZE = 50;
    let batch: Embedding[] = [];
    let totalStored = 0;

    for await (const embedding of embeddingStream) {
      batch.push({
        ...embedding,
        metadata: {
          ...embedding.metadata,
          attachmentId,
          storedAt: new Date().toISOString(),
        },
      });

      if (batch.length >= BATCH_SIZE) {
        await this.storeEmbeddings(collectionName, batch);
        totalStored += batch.length;
        yield totalStored;
        batch = [];
      }
    }

    if (batch.length > 0) {
      await this.storeEmbeddings(collectionName, batch);
      totalStored += batch.length;
      yield totalStored;
    }

    console.log(
      `[Milvus] Stored ${totalStored} embeddings for attachment ${attachmentId} in session ${sessionId}`
    );
  }

  static async storeVectors(
    sessionId: string,
    attachmentId: string,
    embeddings: Embedding[]
  ): Promise<void> {
    if (embeddings.length === 0) {
      console.log(`[Milvus] No embeddings to store for attachment: ${attachmentId}`);
      return;
    }

    const collectionName = CollectionService.generateCName(sessionId);

    const enrichedEmbeddings = embeddings.map((emb) => ({
      ...emb,
      metadata: {
        ...emb.metadata,
        attachmentId,
        storedAt: new Date().toISOString(),
      },
    }));

    await this.storeEmbeddings(collectionName, enrichedEmbeddings);
    console.log(
      `[Milvus] Stored ${embeddings.length} embeddings for attachment ${attachmentId} in session ${sessionId}`
    );
  }

  static async storeEmbeddings(
    collectionName: string,
    embeddings: Embedding[]
  ): Promise<void> {
    if (embeddings.length === 0) {
      return;
    }

    const client = getMilvusClient();

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
}
