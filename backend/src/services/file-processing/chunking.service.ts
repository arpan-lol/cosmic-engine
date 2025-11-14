export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

export interface Chunk {
  content: string;
  index: number;
  metadata?: Record<string, any>;
}

interface PagePosition {
  position: number;
  pageNumber: number;
}

export class ChunkingService {
  static async *chunkContentStream(
    markdown: string,
    options: ChunkOptions = {}
  ): AsyncGenerator<Chunk> {
    const { chunkSize = 4000, overlap = 200 } = options;

    if (chunkSize <= overlap) {
      throw new Error('chunkSize must be greater than chunkOverlap');
    }

    const separators = ['\n\n', '\n', '. ', ' '];
    let buffer = '';
    let chunkIndex = 0;
    let globalPosition = 0;
    let currentPageNumber: number | null = null;

    const SEGMENT_SIZE = 100000;
    
    for (let i = 0; i < markdown.length; i += SEGMENT_SIZE) {
      const segment = markdown.slice(i, Math.min(i + SEGMENT_SIZE, markdown.length));
      buffer += segment;

      while (buffer.length >= chunkSize || (i + SEGMENT_SIZE >= markdown.length && buffer.length > 0)) {
        const endIndex = Math.min(chunkSize, buffer.length);
        let chunkText = buffer.slice(0, endIndex);

        const pageMatch = chunkText.match(/<!-- Slide number: (\d+) -->|^# Sheet (\d+)/m);
        if (pageMatch) {
          currentPageNumber = parseInt(pageMatch[1] || pageMatch[2], 10);
        }

        if (endIndex === chunkSize && buffer.length > chunkSize) {
          let bestSplit = chunkText.length;
          for (const sep of separators) {
            const lastIndex = chunkText.lastIndexOf(sep);
            if (lastIndex > chunkSize * 0.5) {
              bestSplit = lastIndex + sep.length;
              break;
            }
          }
          chunkText = chunkText.slice(0, bestSplit);
        }

        const trimmedChunk = chunkText.trim();
        if (trimmedChunk.length > 0) {
          yield {
            content: trimmedChunk,
            index: chunkIndex++,
            metadata: {
              startChar: globalPosition,
              endChar: globalPosition + trimmedChunk.length,
              length: trimmedChunk.length,
              pageNumber: currentPageNumber,
            },
          };
        }

        const actualLength = chunkText.length;
        buffer = buffer.slice(Math.max(actualLength - overlap, 1));
        globalPosition += actualLength - overlap;

        if (buffer.length < chunkSize && i + SEGMENT_SIZE < markdown.length) {
          break;
        }
      }
    }

    if (buffer.trim().length > 0) {
      yield {
        content: buffer.trim(),
        index: chunkIndex,
        metadata: {
          startChar: globalPosition,
          endChar: globalPosition + buffer.length,
          length: buffer.length,
          pageNumber: currentPageNumber,
        },
      };
    }
  }

  static async chunkContent(
    markdown: string,
    options: ChunkOptions = {}
  ): Promise<Chunk[]> {
    const chunks: Chunk[] = [];
    for await (const chunk of this.chunkContentStream(markdown, options)) {
      chunks.push(chunk);
    }
    return chunks;
  }

  private static extractPageNumbers(content: string): PagePosition[] {
    const pagePositions: PagePosition[] = [];
    
    const lines = content.split('\n');
    let currentPos = 0;
    
    for (const line of lines) {
      const slideMatch = line.match(/<!-- Slide number: (\d+) -->/);
      if (slideMatch) {
        pagePositions.push({
          position: currentPos,
          pageNumber: parseInt(slideMatch[1], 10),
        });
      }
      
      const sheetMatch = line.match(/^# Sheet (\d+)/);
      if (sheetMatch && pagePositions.length === 0) {
        pagePositions.push({
          position: currentPos,
          pageNumber: parseInt(sheetMatch[1], 10),
        });
      }
      
      currentPos += line.length + 1;
    }

    return pagePositions;
  }


  private static determineChunkPageNumber(
    chunkStartPos: number,
    pagePositions: PagePosition[]
  ): number | null {
    if (pagePositions.length === 0) {
      return null;
    }

    // Find the page that contains this chunk
    let relevantPage: number | null = null;
    for (const { position, pageNumber } of pagePositions) {
      if (chunkStartPos >= position) {
        relevantPage = pageNumber;
      } else {
        break;
      }
    }

    return relevantPage;
  }

  private static splitText(
    text: string,
    chunkSize: number,
    chunkOverlap: number
  ): Array<{ content: string; startIndex: number }> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks: Array<{ content: string; startIndex: number }> = [];
    
    // Separators to try 
    const separators = ['\n\n', '\n', '. ', ' ', ''];
    
    let startIndex = 0;
    
    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      let chunkText = text.slice(startIndex, endIndex);
      
      // If we're not at the end and the chunk is full size, try to split at a separator
      if (endIndex < text.length && chunkText.length >= chunkSize) {
        let bestSplit = chunkText.length;
        
        // Try to find a good split point using separators
        for (const separator of separators) {
          if (separator === '') continue;
          
          const lastIndex = chunkText.lastIndexOf(separator);
          if (lastIndex > chunkSize * 0.5) { // Only use if split point is reasonable
            bestSplit = lastIndex + separator.length;
            break;
          }
        }
        
        chunkText = chunkText.slice(0, bestSplit);
      }
      
      chunks.push({
        content: chunkText.trim(),
        startIndex,
      });
      
      // Move start index forward, accounting for overlap
      startIndex += chunkText.length - chunkOverlap;
      
      // Prevent infinite loop
      if (startIndex <= 0 || chunkSize <= chunkOverlap) {
        throw new Error('Invalid chunking parameters: infinite loop detected');
      }
    }
    
    return chunks;
  }
}
