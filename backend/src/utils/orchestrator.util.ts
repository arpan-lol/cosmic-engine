import { jobQueue } from '../queue';
import prisma from '../prisma/client';
import { IngestionService } from '../services/file-processing/ingestion.service';
import { ChunkingService } from '../services/file-processing/chunking.service';
import { EmbeddingService } from '../services/file-processing/embedding.service';
import { CollectionService, StorageService } from '../services/file-processing/milvus';
import { sseService } from '../services/sse.service';

interface OrchestrationJob {
  attachmentId: string;
  userId: number;
  sessionId: string; 
}

async function processFile(attachmentId: string, userId: number, sessionId: string): Promise<void> {
  console.log(`[Orchestrator] Starting pipeline for attachment: ${attachmentId} in session: ${sessionId}`);

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new Error(`Attachment not found: ${attachmentId}`);
    }

    console.log(`[Orchestrator] Processing: ${attachment.filename}`);

    await prisma.chat.create({
      data: {
        sessionId,
        role: 'system',
        content: `📤 Started processing ${attachment.filename}`,
      },
    });

    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'started',
      message: `Processing ${attachment.filename}...`,
      progress: 0,
    });

    // Step 0: Initialize collection for each session
    console.log('[Orchestrator] Step 0: Initializing vector store...');
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'initialization',
      message: 'Initializing vector store...',
      progress: 10,
    });
    const collectionName = CollectionService.generateCName(sessionId);
    await CollectionService.initializeCollection(collectionName);

    // Step 1: Ingestion
    console.log('[Orchestrator] Step 1: Converting to markdown...');
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'ingestion',
      message: 'Preprocessing',
      progress: 25,
    });
    const markdown = await IngestionService.convertToMarkdown(attachment.url);

    await prisma.chat.create({
      data: {
        sessionId,
        role: 'system',
        content: `✅ Converted to markdown (${markdown.length.toLocaleString()} characters)`,
      },
    });

    // Step 2-4: Stream-based processing (chunking, embedding, storage)
    console.log('[Orchestrator] Steps 2-4: Stream processing chunks...');
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'streaming',
      message: `Chunking ${markdown.length} characters`,
      progress: 40,
    });

    const chunkStream = ChunkingService.chunkContentStream(markdown, {
      chunkSize: 1000,
      overlap: 200,
    });

    const embeddingStream = EmbeddingService.generateEmbeddingsStream(chunkStream);
    const storageStream = StorageService.storeVectorsStream(sessionId, attachmentId, embeddingStream);

    let totalChunks = 0;
    let lastProgress = 40;
    
    for await (const storedCount of storageStream) {
      totalChunks = storedCount;
      const newProgress = Math.min(40 + Math.floor((storedCount / 100) * 40), 80);
      if (newProgress > lastProgress) {
        lastProgress = newProgress;
        sseService.sendToAttachment(attachmentId, {
          status: 'processing',
          step: 'streaming',
          message: `Stored ${storedCount} vectors...`,
          progress: newProgress,
        });
      }
    }

    console.log(`[Orchestrator] Stream processing completed: ${totalChunks} chunks`);

    await prisma.chat.create({
      data: {
        sessionId,
        role: 'system',
        content: `📄 Processed ${attachment.filename}: ${totalChunks} chunks • ${totalChunks} vectors created`,
      },
    });

    // Step 5: Build index and load collection (now that data is inserted)
    console.log('[Orchestrator] Step 5: Building index and loading collection...');
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'indexing',
      message: 'Building search index...',
      progress: 85,
    });
    await CollectionService.buildIndexAndLoad(collectionName);

    await prisma.chat.create({
      data: {
        sessionId,
        role: 'system',
        content: ` Vector search index built for ${attachment.filename} (${totalChunks} vectors)`,
      },
    });

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

    console.log(`[Orchestrator] ✅ Successfully processed: ${attachmentId}`);
    
    sseService.sendToAttachment(attachmentId, {
      status: 'completed',
      step: 'finished',
      message: `Successfully processed! (${totalChunks} chunks)`,
      progress: 100,
      chunkCount: totalChunks,
      embeddingCount: totalChunks,
    });

    setTimeout(() => {
      sseService.closeAttachment(attachmentId);
    }, 1000);

  } catch (error) {
    console.error(`[Orchestrator] ❌ Error processing ${attachmentId}:`, error);

    sseService.sendToAttachment(attachmentId, {
      status: 'failed',
      step: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
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
      console.error('[Orchestrator] Failed to update error status:', updateError);
    }

    setTimeout(() => {
      sseService.closeAttachment(attachmentId);
    }, 1000);

    throw error;
  }
}

export function Orchestrator() {
  console.log('[Orchestrator] Registering file processor...');

  jobQueue.registerHandler('process-file', async (data: OrchestrationJob) => {
    const { attachmentId, userId, sessionId } = data;
    console.log(`[Orchestrator] Processing file job: attachmentId=${attachmentId}, userId=${userId}, sessionId=${sessionId}`);
    await processFile(attachmentId, userId, sessionId);
    console.log(`[Orchestrator] ✅ File job completed: ${attachmentId}`);
  });

  console.log('[Orchestrator] ✅ File processor ready');
}
