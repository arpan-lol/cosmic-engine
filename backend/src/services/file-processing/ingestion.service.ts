import path from 'path';
import { logger } from '../../utils/logger.util';
import { ProcessingError } from '../../types/errors';

interface PyResponse {
  success: boolean;
  url: string;
  processing_time: number;
  content_length?: number;
  markdown_content?: string;
  error_message?: string;
  cached: boolean;
  processing_strategy?: string;
  chunks?: Array<{
    chunk_content: string;
    chunk_page_no: number | null;
  }>;
}

export class IngestionService {
  private static readonly PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'python-md:3001';

  static async convertToMarkdown(filePath: string): Promise<string> {
    try {
      const absolutePath = path.isAbsolute(filePath) 
        ? filePath 
        : path.resolve(process.cwd(), filePath);

      logger.info('Ingestion', 'Converting file to markdown', { filePath: absolutePath });

      const response = await fetch(`http://${this.PYTHON_SERVICE_URL}/process-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: absolutePath,
        }),
      });

      if (!response.ok) {
        logger.error('Ingestion', `Python service responded with status: ${response.status}`, undefined, { filePath: absolutePath });
        throw new ProcessingError(`Python service responded with status: ${response.status}`);
      }

      const data = await response.json() as PyResponse;

      if (!data.success) {
        logger.error('Ingestion', 'Python service failed to process file', undefined, { filePath: absolutePath, errorMessage: data.error_message });
        throw new ProcessingError(data.error_message || 'Python service failed to process file');
      }

      if (!data.markdown_content) {
        logger.error('Ingestion', 'Python service returned empty markdown content', undefined, { filePath: absolutePath });
        throw new ProcessingError('Python service returned empty markdown content');
      }

      logger.info(
        'Ingestion',
        'Converted successfully',
        { contentLength: data.content_length, processingTime: data.processing_time.toFixed(2), filePath: absolutePath }
      );

      return data.markdown_content;
    } catch (error) {
      logger.error('Ingestion', 'Conversion failed', error instanceof Error ? error : undefined, { filePath });
      
      if (error instanceof ProcessingError) {
        throw error;
      }
      
      throw new ProcessingError(
        `Failed to convert file to markdown: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
