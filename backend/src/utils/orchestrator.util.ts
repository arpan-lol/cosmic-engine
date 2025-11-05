import { jobQueue } from '../queue';
import prisma from '../prisma/client';
import { IngestionService } from '../services/file-processing/ingestion.service';
import { ChunkingService } from '../services/file-processing/chunking.service';
import { EmbeddingService } from '../services/file-processing/embedding.service';
import { VectorStoreService } from '../services/file-processing/vector-store.service';
import { sseService } from '../services/sse.service';

interface OrchestrationJob {
  attachmentId: string;
  userId: number;
}


async function processFile(attachmentId: string, userId: number): Promise<void> {
  console.log(`[Orchestrator] Starting pipeline for attachment: ${attachmentId}`);

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new Error(`Attachment not found: ${attachmentId}`);
    }

    console.log(`[Orchestrator] Processing: ${attachment.filename}`);

    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'started',
      message: `Processing ${attachment.filename}...`,
      progress: 0,
    });

    console.log('[Orchestrator] Step 1: Converting to markdown...');
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'ingestion',
      message: 'Converting file to markdown...',
      progress: 25,
    });
    const markdown = await IngestionService.convertToMarkdown(attachment.url);

    console.log('[Orchestrator] Step 2: Chunking content...');
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'chunking',
      message: `Splitting into chunks (${markdown.length} characters)...`,
      progress: 50,
    });
    const chunks = await ChunkingService.chunkContent(markdown, {
      chunkSize: 1000,
      overlap: 200,
    });

    console.log('[Orchestrator] Step 3: Generating embeddings...');
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'embedding',
      message: `Generating embeddings for ${chunks.length} chunks...`,
      progress: 75,
    });

    const embeddings = Promise.all(chunks.map(chunk=>{EmbeddingService.generateEmbedding(chunk.content)}))
    // const embeddings = await EmbeddingService.generateEmbeddings(chunks);

    console.log('[Orchestrator] Step 4: Storing vectors...');
    sseService.sendToAttachment(attachmentId, {
      status: 'processing',
      step: 'storage',
      message: 'Storing vectors in database...',
      progress: 90,
    });
    await VectorStoreService.storeVectors(attachmentId, embeddings);

    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        metadata: {
          ...(attachment.metadata as object),
          processed: true,
          processedAt: new Date().toISOString(),
          chunkCount: chunks.length,
          markdownLength: markdown.length,
        },
      },
    });

    console.log(`[Orchestrator] ✅ Successfully processed: ${attachmentId}`);
    
    sseService.sendToAttachment(attachmentId, {
      status: 'completed',
      step: 'finished',
      message: `Successfully processed! (${chunks.length} chunks)`,
      progress: 100,
      chunkCount: chunks.length,
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

    throw error; // Re-throw for job queue retry mechanism
  }
}

export function Orchestrator() {
  console.log('[Orchestrator] Registering file processor...');

  jobQueue.registerHandler('process-file', async (data: OrchestrationJob) => {
    const { attachmentId, userId } = data;
    console.log(`[Orchestrator] Processing file job: attachmentId=${attachmentId}, userId=${userId}`);
    await processFile(attachmentId, userId);
    console.log(`[Orchestrator] ✅ File job completed: ${attachmentId}`);
  });

  console.log('[Orchestrator] ✅ File processor ready');
}
