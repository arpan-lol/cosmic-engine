import { jobQueue } from '../queue';
import prisma from '../prisma/client';
import { IngestionService } from '../services/ingestion.service';
import { ChunkingService } from '../services/chunking.service';
import { EmbeddingService } from '../services/embedding.service';
import { CollectionService, StorageService } from '../services//milvus';
import { sseService } from '../services/sse.service';
import { logger } from './logger.util';
import { ProcessingError } from '../types/errors';
import { processBM25 } from './bm25.util';

interface OrchestrationJob {
  attachmentId: string;
  userId: number;
  sessionId: string; 
}

async function processFile(attachmentId: string, userId: number, sessionId: string): Promise<void> {
  logger.info('Orchestrator', `Starting pipeline for attachment: ${attachmentId}`, { sessionId, userId });

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new ProcessingError(`Attachment not found: ${attachmentId}`);
    }

    logger.info('Orchestrator', `Processing: ${attachment.filename}`, { attachmentId, sessionId });

    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'started',
      message: `Processing ${attachment.filename}...`,
      progress: 0,
    });

    // Step 0: Initialize collection for each session
    logger.info('Orchestrator', 'Step 0: Initializing vector store', { attachmentId, sessionId });
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'initialization',
      message: 'Initializing vector store...',
      progress: 10,
    });
    const collectionName = CollectionService.generateCName(sessionId);
    await CollectionService.initializeCollection(collectionName);

    logger.info('Orchestrator', 'Step 1: Converting to markdown', { attachmentId, sessionId });
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'ingestion',
      message: 'Preprocessing',
      progress: 25,
    });
    const markdown = await IngestionService.convertToMarkdown(attachment.url);


    // Step 2-4: Stream-based processing (chunking, embedding, storage)
    logger.info('Orchestrator', 'Steps 2-4: Stream processing chunks', { attachmentId, sessionId, markdownLength: markdown.length });
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'chunking',
      message: `Chunking ${markdown.length} characters`,
      progress: 40,
    });

    const chunkStream = ChunkingService.chunkContentStream(markdown, {
      chunkSize: 1000,
      overlap: 200,
    });

    const embeddingStream = EmbeddingService.generateEmbeddingsStream(chunkStream);
    const storageStream = StorageService.storeVectorsStream(sessionId, attachmentId, embeddingStream, attachment.filename);

    let totalChunks = 0;
    let lastProgress = 40;
    let lastReportedCount = 0;
    
    for await (const storedCount of storageStream) {
      totalChunks = storedCount;
      const newProgress = Math.min(40 + Math.floor((storedCount / 100) * 40), 80);
      if (newProgress > lastProgress || storedCount - lastReportedCount >= 50) {
        lastProgress = newProgress;
        lastReportedCount = storedCount;
        sseService.sendToAttachment(attachmentId, {
          status: 'processing',
          step: 'embedding',
          message: `Processing vectors (${storedCount} stored)...`,
          progress: newProgress,
        });
      }
    }

    logger.info('Orchestrator', `Stream processing completed: ${totalChunks} chunks`, { attachmentId, sessionId, totalChunks });

    logger.info('Orchestrator', 'Step 5: Building index and loading collection', { attachmentId, sessionId });
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'indexing',
      message: 'Building search index...',
      progress: 85,
    });
    await CollectionService.buildIndexAndLoad(collectionName);


    // Step 6: Update attachment metadata
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        metadata: {
          ...(attachment.metadata as object),
          processed: true,
          processedAt: new Date().toISOString(),
          chunkCount: totalChunks,
          embeddingCount: totalChunks,
          markdownLength: markdown.length,
          sessionId,
        },
      },
    });

    logger.info('Orchestrator', `Successfully processed: ${attachmentId}`, { attachmentId, sessionId, totalChunks });
    
    sseService.sendToAttachment(attachmentId, {
      status: 'completed',
      step: 'finished',
      message: `Successfully processed! (${totalChunks} chunks)`,
      progress: 100,
      chunkCount: totalChunks,
      embeddingCount: totalChunks,
    });

    await sseService.publishToSession(sessionId, {
      type: 'notification',
      scope: 'session',
      message: `${attachment.filename} processed successfully`,
      data: {
        title: 'File Processing Complete',
        body: [
          `File: ${attachment.filename}`,
          `Chunks created: ${totalChunks}`,
          `Embeddings generated: ${totalChunks}`,
          `Ready for semantic search`,
        ],
      },
      timestamp: new Date().toISOString(),
    });

    setTimeout(() => {
      sseService.closeAttachment(attachmentId);
    }, 1000);

  } catch (error: any) {
    logger.error('Orchestrator', `Error processing ${attachmentId}`, error instanceof Error ? error : undefined, { attachmentId, sessionId });

    let userMessage = 'Processing failed! Please try again later.';
    
    if (error?.shouldExposeToClient && error?.clientMessage) {
      userMessage = error.clientMessage;
    }

    sseService.sendToAttachment(attachmentId, {
      status: 'failed',
      step: 'error',
      message: userMessage,
      progress: 0,
    });

    try {
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          metadata: {
            processed: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString(),
          },
        },
      });
    } catch (updateError) {
      logger.error('Orchestrator', 'Failed to update error status', updateError instanceof Error ? updateError : undefined, { attachmentId });
    }

    setTimeout(() => {
      sseService.closeAttachment(attachmentId);
    }, 1000);

    throw error;
  }
}

export function Orchestrator() {
  logger.info('Orchestrator', 'Registering file processor');

  jobQueue.registerHandler('process-file', async (data: OrchestrationJob) => {
    const { attachmentId, userId, sessionId } = data;
    logger.info('Orchestrator', 'Processing file job', { attachmentId, userId, sessionId });
    await processFile(attachmentId, userId, sessionId);
    logger.info('Orchestrator', 'File job completed', { attachmentId });
  });

  jobQueue.registerHandler('index-bm25', async (data: OrchestrationJob) => {
    const { attachmentId, userId, sessionId } = data;
    logger.info('Orchestrator', 'Processing BM25 indexing job', { attachmentId, userId, sessionId });
    await processBM25(attachmentId, userId, sessionId);
    logger.info('Orchestrator', 'BM25 indexing job completed', { attachmentId });
  });

  logger.info('Orchestrator', 'File processor ready');
}
