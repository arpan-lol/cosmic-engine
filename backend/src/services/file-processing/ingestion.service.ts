import path from 'path';

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
  private static readonly PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

  static async convertToMarkdown(filePath: string): Promise<string> {
    try {
      const absolutePath = path.isAbsolute(filePath) 
        ? filePath 
        : path.resolve(process.cwd(), filePath);

      console.log(`[Ingestion] Converting file to markdown: ${absolutePath}`);

      // call the python microservice
      const response = await fetch(`${this.PYTHON_SERVICE_URL}/process-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: absolutePath,
        }),
      });

      if (!response.ok) {
        throw new Error(`Python service responded with status: ${response.status}`);
      }

      const data = await response.json() as PyResponse;

      if (!data.success) {
        throw new Error(data.error_message || 'Python service failed to process file');
      }

      if (!data.markdown_content) {
        throw new Error('Python service returned empty markdown content');
      }

      console.log(
        `[Ingestion] ✅ Converted successfully: ${data.content_length} characters in ${data.processing_time.toFixed(2)}s`
      );

      return data.markdown_content;
    } catch (error) {
      console.error('[Ingestion] ❌ Conversion failed:', error);
      throw new Error(
        `Failed to convert file to markdown: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
