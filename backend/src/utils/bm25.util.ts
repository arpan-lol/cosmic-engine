import prisma from '../prisma/client';
import { logger } from './logger.util';
import { ProcessingError } from '../types/errors';
import { Chunk } from 'src/services/chunking.service';
import { SearchService } from 'src/services/milvus';
import { sseService } from '../services/sse.service';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .match(/\p{L}+/gu)
    || [];
}

async function processBM25(
  attachmentId: string,
  userId: number,
  sessionId: string
): Promise<void> {
  logger.info(
    'BM25',
    `Starting BM25 indexing for attachment: ${attachmentId}`,
    { sessionId, userId }
  );

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new ProcessingError(`Attachment not found: ${attachmentId}`);
    }

    logger.info(
      'BM25',
      `Processing: ${attachment.filename}`,
      { attachmentId, sessionId }
    );

    await prisma.attachment.update({
      where: { id: attachmentId },
      data: { bm25indexStatus: 'processing' },
    });

    logger.info('BM25', 'Step 1: Load chunks', {
      attachmentId,
      sessionId,
    });

    
    const chunks: Chunk[] = await SearchService.getAllChunks(sessionId, attachmentId)

    if (!chunks.length) {
      throw new ProcessingError(
        `No chunks found in Milvus for attachment: ${attachmentId}`
      );
    }

    logger.info('BM25', 'Step 2: Tokenize and build TF/DF maps', {
      attachmentId,
      sessionId,
    });

    type DocStats = {
      chunkIndex: number;
      tokens: string[];
      length: number;
    };

    const docs: DocStats[] = chunks.map((chunk) => {
      const tokens = tokenize(chunk.content);
      return {
        chunkIndex: Number(chunk.index),
        tokens,
        length: tokens.length,
      };
    });

    const totalDocs = docs.length;
    const avgChunkLength =
      docs.reduce((sum, d) => sum + d.length, 0) / totalDocs || 0;

    // dfMap[term] = number of docs containing term
    const dfMap: Record<string, number> = {};
    // tfMaps[chunkIndex][term] = term frequency in that chunk
    const tfMaps: Record<number, Record<string, number>> = {};

    for (const doc of docs) {
      const tf: Record<string, number> = {};
      for (const token of doc.tokens) {
        tf[token] = (tf[token] || 0) + 1;
      }
      tfMaps[doc.chunkIndex] = tf;

      const uniqueTerms = new Set(doc.tokens);
      for (const term of uniqueTerms) {
        dfMap[term] = (dfMap[term] || 0) + 1;
      }
    }

    // STEP 3: Store BM25 meta row
    logger.info('BM25', 'Step 3: Store BM25 meta', {
      attachmentId,
      sessionId,
    });

    await prisma.bM25IndexMeta.upsert({
      where: { attachmentId },
      create: {
        attachmentId,
        totalDocs,
        avgChunkLength,
      },
      update: {
        totalDocs,
        avgChunkLength,
      },
    });

    // STEP 4: Flatten and store BM25 entries
    const entriesData: Array<{
      attachmentId: string;
      chunkIndex: number;
      term: string;
      tf: number;
      df: number;
      chunkLength: number;
      avgChunkLength: number;
      totalDocs: number;
    }> = [];

    for (const doc of docs) {
      const tf = tfMaps[doc.chunkIndex];
      for (const term in tf) {
        entriesData.push({
          attachmentId,
          chunkIndex: Number(doc.chunkIndex),
          term,
          tf: tf[term],
          df: dfMap[term],
          chunkLength: doc.length,
          avgChunkLength,
          totalDocs,
        });
      }
    }

    logger.info('BM25', 'Step 4: Store BM25 entries', {
      attachmentId,
      sessionId,
      entryCount: entriesData.length,
    });

    //clear old entries before inserting new ones
    await prisma.bM25IndexEntry.deleteMany({
      where: { attachmentId },
    });

    // Batch insert
    const BATCH_SIZE = 1000;
    for (let i = 0; i < entriesData.length; i += BATCH_SIZE) {
      const batch = entriesData.slice(i, i + BATCH_SIZE);
      if (batch.length === 0) continue;
      await prisma.bM25IndexEntry.createMany({
        data: batch,
      });
    }

    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        bm25indexStatus: 'completed',
        bm25indexedAt: new Date(), 
      },
    });

    logger.info(
      'BM25',
      `Successfully indexed: ${attachmentId}`,
      { attachmentId, sessionId }
    );

    await sseService.publishToSession(sessionId, {
      type: 'notification',
      scope: 'session',
      message: `${attachment.filename} indexed for keyword search`,
      data: {
        title: 'BM25 Index Complete',
        body: [
          `File: ${attachment.filename}`,
          `Total chunks indexed: ${totalDocs}`,
          `Unique terms: ${Object.keys(dfMap).length}`,
          `Ready for hybrid search`,
        ],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error(
      'BM25',
      `Error indexing ${attachmentId}`,
      error instanceof Error ? error : undefined,
      { attachmentId, sessionId }
    );

    try {
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: { bm25indexStatus: 'failed' },
      });
    } catch {
    }

    throw error;
  }
}


export { processBM25, tokenize };
