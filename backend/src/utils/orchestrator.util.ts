import { jobQueue } from '../queue';
import prisma from '../prisma/client';
import { IngestionService } from '../services/ingestion.service';
import { ChunkingService } from '../services/chunking.service';
import { EmbeddingService } from '../services/embedding.service';
import { CollectionService, StorageService } from '../services//milvus';
import { sseService } from '../services/sse.service';
import { GenerationService } from '../services/llm/generation.service';
import { TITLE_PROMPT, buildTitlePrompt } from '../services/llm/prompts/title.prompt';
import { logger } from './logger.util';
import { ProcessingError } from '../types/errors';
import { processBM25 } from './bm25.util';

interface OrchestrationJob {
  attachmentId: string;
  userId: number;
  sessionId: string;
}

interface TitleGenerationJob {
  sessionId: string;
  firstUserMessage: string;
}

async function processFile(attachmentId: string, userId: number, sessionId: string): Promise<void> {
  logger.info('Orchestrator', `Starting pipeline for attachment: ${attachmentId}`, { sessionId, userId });

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId }
    });

    if (!attachment) {
      throw new ProcessingError(`Attachment not found: ${attachmentId}`);
    }

    await sseService.publishToSession(sessionId, {
      type: 'notification',
      scope: 'session',
      message: 'File processing started',
      attachmentId,
      data: {
        title: `Processing ${attachment.filename}`,
        body: [
          `Attachment ID: ${attachmentId}`,
          `Session: ${sessionId}`,
          `Starting ingestion & embedding pipeline`
        ]
      },
      timestamp: new Date().toISOString()
    });

    logger.info('Orchestrator', `Processing: ${attachment.filename}`, { attachmentId, sessionId });

    sseService.sendProgress(attachmentId, {
      status: 'connected',
      step: 'connected',
      message: `Connected to processing ${attachment.filename}...`,
      progress: 0,
      phase: 'file-processing'
    });

    sseService.sendProgress(attachmentId, {
      status: 'processing',
      step: 'started',
      message: `Processing ${attachment.filename}...`,
      progress: 5,
      phase: 'file-processing'
    });

    logger.info('Orchestrator', 'Step 0: Initializing vector store', { attachmentId, sessionId });
    sseService.sendProgress(attachmentId, {
      status: 'processing',
      step: 'initialization',
      message: 'Initializing vector store...',
      progress: 10,
      phase: 'file-processing'
    });

    const collectionName = CollectionService.generateCName(sessionId);
    await CollectionService.initializeCollection(collectionName);

    logger.info('Orchestrator', 'Step 1: Converting to markdown', { attachmentId, sessionId });
    sseService.sendProgress(attachmentId, {
      status: 'processing',
      step: 'ingestion',
      message: 'Preprocessing',
      progress: 25,
      phase: 'file-processing'
    });

    const markdown = await IngestionService.convertToMarkdown(attachment.url);

    logger.info('Orchestrator', 'Steps 2-4: Stream processing chunks', { attachmentId, sessionId, markdownLength: markdown.length });

    sseService.sendProgress(attachmentId, {
      status: 'processing',
      step: 'chunking',
      message: `Chunking ${markdown.length} characters`,
      progress: 40,
      phase: 'file-processing'
    });

    const chunkSize = 1000;
    const overlap = 200;

    const estimatedTotalChunks = Math.max(
      1,
      Math.ceil((markdown.length - overlap) / (chunkSize - overlap))
    );

    const chunkStream = ChunkingService.chunkContentStream(markdown, {
      chunkSize,
      overlap
    });

    const embeddingStream = EmbeddingService.generateEmbeddingsStream(chunkStream);
    const storageStream = StorageService.storeVectorsStream(sessionId, attachmentId, embeddingStream, attachment.filename);

    let totalChunks = 0;
    let lastProgress = 40;
    let lastReportedCount = 0;

    for await (const storedCount of storageStream) {
      totalChunks = storedCount;

      const embeddingProgress = storedCount / estimatedTotalChunks;

      const newProgress = Math.min(
        80,
        40 + Math.floor(embeddingProgress * 40)
      );

      if (newProgress > lastProgress || storedCount - lastReportedCount >= 50) {
        lastProgress = newProgress;
        lastReportedCount = storedCount;

        sseService.sendProgress(attachmentId, {
          status: 'processing',
          step: 'embedding',
          message: `Processing vectors (${storedCount} stored)...`,
          progress: newProgress,
          phase: 'file-processing'
        });
      }

      let lastMilestone = 0;
      const milestone = Math.floor(storedCount / 100);

      if (milestone > lastMilestone) {
        lastMilestone = milestone;

        let estimatedPercent = Math.round(embeddingProgress * 100);
        if (estimatedPercent >= 100) estimatedPercent = 99;

        await sseService.publishToSession(sessionId, {
          type: 'notification',
          scope: 'session',
          message: 'embedding-progress',
          attachmentId,
          data: {
            title: `Embedding progress`,
            body: [
              `Stored embeddings: ${storedCount}`,
              `Approximate progress: ${estimatedPercent}%`
            ]
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    logger.info('Orchestrator', `Stream processing completed: ${totalChunks} chunks`, { attachmentId, sessionId, totalChunks });

    logger.info('Orchestrator', 'Step 5: Building index and loading collection', { attachmentId, sessionId });

    sseService.sendProgress(attachmentId, {
      status: 'processing',
      step: 'indexing',
      message: 'Building search index...',
      progress: 85,
      phase: 'file-processing'
    });

    await CollectionService.buildIndexAndLoad(collectionName);

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
          sessionId
        }
      }
    });

    logger.info('Orchestrator', `Successfully processed: ${attachmentId}`, { attachmentId, sessionId, totalChunks });

    sseService.sendProgress(attachmentId, {
      status: 'completed',
      step: 'finished',
      message: `Successfully processed! (${totalChunks} chunks)`,
      progress: 100,
      chunkCount: totalChunks,
      embeddingCount: totalChunks,
      phase: 'file-processing'
    });

    await sseService.publishToSession(sessionId, {
      type: 'success',
      scope: 'session',
      message: `${attachment.filename} processed successfully`,
      attachmentId,
      actionType: 'view-chunks',
      data: {
        title: 'File Processing Complete',
        body: [
          `Embeddings generated: ${totalChunks}`,
          `Ready for semantic search`
        ]
      },
      timestamp: new Date().toISOString()
    });

    setTimeout(() => {
      sseService.closeProgress(attachmentId);
    }, 1000);

  } catch (error: any) {
    logger.error('Orchestrator', `Error processing ${attachmentId}`, error instanceof Error ? error : undefined, { attachmentId, sessionId });

    let userMessage = 'Processing failed! Please try again later.';
    if (error?.shouldExposeToClient && error?.clientMessage) {
      userMessage = error.clientMessage;
    }

    sseService.sendProgress(attachmentId, {
      status: 'error',
      step: 'error',
      message: userMessage,
      progress: 0,
      phase: 'file-processing',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    try {
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          metadata: {
            processed: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString()
          }
        }
      });
    } catch {}

    setTimeout(() => {
      sseService.closeProgress(attachmentId);
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

  jobQueue.registerHandler('generate-title', async (data: TitleGenerationJob) => {
    const { sessionId, firstUserMessage } = data;
    logger.info('Orchestrator', 'Processing title generation job', { sessionId });

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          chats: {
            include: {
              attachments: true
            },
            take: 1
          }
        }
      });

      if (!session) {
        logger.warn('Orchestrator', 'Session not found for title generation', { sessionId });
        return;
      }

      if (session.titleSource === 'USER_EDITED') {
        logger.info('Orchestrator', 'Skipping title generation - user has manually edited title', { sessionId });
        return;
      }

      const fileNames = session.chats[0]?.attachments?.map(att => att.filename) || [];
      
      logger.info('Orchestrator', 'Generating title with context', { 
        sessionId, 
        messageLength: firstUserMessage.length,
        fileCount: fileNames.length,
        fileNames 
      });

      const generatedTitle = await GenerationService.generate({
        systemPrompt: TITLE_PROMPT,
        userPrompt: buildTitlePrompt(firstUserMessage, fileNames),
        temperature: 0.7,
        maxTokens: 50
      });

      logger.info('Orchestrator', 'LLM returned title', { 
        sessionId, 
        rawTitle: generatedTitle,
        rawTitleLength: generatedTitle.length 
      });

      const cleanTitle = generatedTitle.trim().replace(/^["']|["']$/g, '').substring(0, 100);
      
      logger.info('Orchestrator', 'Title after cleaning', { 
        sessionId, 
        cleanTitle,
        cleanTitleLength: cleanTitle.length 
      });

      if (!cleanTitle) {
        logger.warn('Orchestrator', 'Empty title after cleaning, using fallback', { 
          sessionId, 
          rawTitle: generatedTitle 
        });
        
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            title: 'New Chat',
            titleSource: 'DEFAULT'
          }
        });
        return;
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: {
          title: cleanTitle,
          titleSource: 'AI_GENERATED'
        }
      });

      logger.info('Orchestrator', 'Title updated in database', { sessionId, title: cleanTitle });

      await sseService.publishToSession(sessionId, {
        type: 'title-update',
        scope: 'session',
        message: 'Title updated',
        newTitle: cleanTitle,
        data: {
          title: 'Conversation Title Generated',
          body: [
            `Title: "${cleanTitle}"`,
            fileNames.length > 0 ? `Based on ${fileNames.length} document${fileNames.length !== 1 ? 's' : ''}` : 'Based on conversation content'
          ]
        },
        timestamp: new Date().toISOString()
      });

      logger.info('Orchestrator', 'Title generated successfully', { sessionId, title: cleanTitle });

    } catch (error: any) {
      logger.error('Orchestrator', 'Error generating title', error instanceof Error ? error : undefined, { sessionId });

      try {
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            title: 'New Chat',
            titleSource: 'DEFAULT'
          }
        });
      } catch {}
    }
  });

  logger.info('Orchestrator', 'File processor ready');
}