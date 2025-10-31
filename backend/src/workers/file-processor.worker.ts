import { jobQueue } from '../queue';
import { FileProcessingService } from '../services/file-processing';

interface ProcessFileJob {
  attachmentId: string;
  userId: number;
}

export function startFileProcessorWorker() {
  console.log('[Worker] Registering file processor worker...');

  jobQueue.registerHandler<ProcessFileJob>('process-file', async (data) => {
    const { attachmentId, userId } = data;

    console.log(`[Worker] Processing file job: attachmentId=${attachmentId}, userId=${userId}`);

    // ⭐ run the processing pipeline
    await FileProcessingService.processFile(attachmentId, userId);

    console.log(`[Worker] ✅ File job completed: ${attachmentId}`);
  });

  console.log('[Worker] ✅ File processor worker ready');
}
