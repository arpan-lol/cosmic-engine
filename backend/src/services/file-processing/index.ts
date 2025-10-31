import prisma from '../../prisma/client';
import { IngestionService } from './ingestion.service';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';

export class FileProcessingService {
  /**
   * ⭐ main processing pipeline
   */
  static async processFile(attachmentId: string, userId: number): Promise<void> {
    console.log(`[FileProcessing] Starting pipeline for attachment: ${attachmentId}`);

    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        throw new Error(`Attachment not found: ${attachmentId}`);
      }

      console.log(`[FileProcessing] Processing: ${attachment.filename}`);
      //TBD

    
      } catch (updateError) {
        console.error('[FileProcessing] Failed to update error status:', updateError);
      }
    }
}
