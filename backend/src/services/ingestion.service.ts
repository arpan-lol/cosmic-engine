import path from 'path';
import { Readable } from 'stream';
import { logger } from '../utils/logger.util';
import { ProcessingError } from '../types/errors';

interface PyResponse {
  success: boolean;
  url: string;
  processing_time: number;
  content_length?: number;
  markdown_content?: string;
  error_message?: string;
  cached: boolean;
  processing_strategy?: string;
}

export interface MarkdownSegment {
  content: string;
  pageNumber?: number;
  metadata?: Record<string, any>;
  strategy?: string;
  unitType?: string;
  unitIndex?: number;
}

interface PyStreamEvent {
  type: 'meta' | 'text' | 'done' | 'error';
  content?: string;
  pageNumber?: number;
  metadata?: Record<string, any>;
  strategy?: string;
  unitType?: string;
  unitIndex?: number;
  errorMessage?: string;
  detail?: string;
}

export class IngestionService {
  private static readonly PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'python-md:3001';

  static async *streamMarkdown(filePath: string): AsyncGenerator<MarkdownSegment> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    logger.info('Ingestion', 'Streaming file extraction', { filePath: absolutePath });

    const response = await fetch(`http://${this.PYTHON_SERVICE_URL}/process-file-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_path: absolutePath,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Ingestion', `Python stream service responded with status: ${response.status}`, undefined, {
        filePath: absolutePath,
        responseBody: errorText.substring(0, 500)
      });
      throw new ProcessingError(`Python service responded with status: ${response.status}`);
    }

    if (!response.body) {
      throw new ProcessingError('Python service returned no response body');
    }

    const nodeStream = Readable.fromWeb(response.body as any);
    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of nodeStream) {
      buffer += decoder.decode(chunk as Buffer, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }

        let event: PyStreamEvent;
        try {
          event = JSON.parse(trimmed) as PyStreamEvent;
        } catch (parseError) {
          logger.error('Ingestion', 'Failed to parse Python stream event', parseError instanceof Error ? parseError : undefined, {
            filePath: absolutePath,
            responsePreview: trimmed.substring(0, 500)
          });
          throw new ProcessingError('Python service returned invalid stream JSON');
        }

        if (event.type === 'error') {
          logger.error('Ingestion', 'Python stream service failed to process file', undefined, {
            filePath: absolutePath,
            errorMessage: event.errorMessage,
            detail: event.detail
          });
          throw new ProcessingError(event.errorMessage || 'File processing failed');
        }

        if (event.type !== 'text') {
          continue;
        }

        if (!event.content) {
          continue;
        }

        yield {
          content: event.content,
          pageNumber: event.pageNumber,
          metadata: event.metadata,
          strategy: event.strategy,
          unitType: event.unitType,
          unitIndex: event.unitIndex,
        };
      }
    }

    const tail = (buffer + decoder.decode()).trim();
    if (tail) {
      const event = JSON.parse(tail) as PyStreamEvent;
      if (event.type === 'error') {
        throw new ProcessingError(event.errorMessage || 'File processing failed');
      }
      if (event.type === 'text' && event.content) {
        yield {
          content: event.content,
          pageNumber: event.pageNumber,
          metadata: event.metadata,
          strategy: event.strategy,
          unitType: event.unitType,
          unitIndex: event.unitIndex,
        };
      }
    }
  }

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
        const errorText = await response.text();
        logger.error('Ingestion', `Python service responded with status: ${response.status}`, undefined, { 
          filePath: absolutePath, 
          responseBody: errorText.substring(0, 500) 
        });
        throw new ProcessingError(`Python service responded with status: ${response.status}`);
      }

      const responseText = await response.text();
      let data: PyResponse;
      
      try {
        data = JSON.parse(responseText) as PyResponse;
      } catch (parseError) {
        logger.error('Ingestion', 'Failed to parse Python service response', parseError instanceof Error ? parseError : undefined, { 
          filePath: absolutePath,
          responsePreview: responseText.substring(0, 500)
        });
        throw new ProcessingError(`Python service returned invalid JSON. Response preview: ${responseText.substring(0, 100)}`);
      }

      if (!data.success) {
        logger.error('Ingestion', 'Python service failed to process file', undefined, { filePath: absolutePath, errorMessage: data.error_message });
        throw new ProcessingError('File processing failed');
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
