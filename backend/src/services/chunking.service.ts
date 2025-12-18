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
    const { chunkSize = 1000, overlap = 200 } = options;

    if (chunkSize <= overlap) {
      throw new Error('chunkSize must be greater than chunkOverlap');
    }

    const pagePositions = this.extractPageNumbers(markdown);

    const separators = ['\n\n', '\n', '. ', ' '];
    let buffer = '';
    let chunkIndex = 0;
    let globalPosition = 0;

    const SEGMENT_SIZE = 100000;
    
    for (let i = 0; i < markdown.length; i += SEGMENT_SIZE) {
      const segment = markdown.slice(i, Math.min(i + SEGMENT_SIZE, markdown.length));
      buffer += segment;

      while (buffer.length >= chunkSize || (i + SEGMENT_SIZE >= markdown.length && buffer.length > 0)) {
        const endIndex = Math.min(chunkSize, buffer.length);
        let chunkText = buffer.slice(0, endIndex);

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
          const pageNumber = this.determineChunkPageNumber(globalPosition, pagePositions);
          
          if (chunkIndex % 10 === 0) {
            console.log(`[Chunking] Chunk ${chunkIndex}: position ${globalPosition}, pageNumber: ${pageNumber ?? 'null'}`);
          }
          
          yield {
            content: trimmedChunk,
            index: chunkIndex++,
            metadata: {
              startChar: globalPosition,
              endChar: globalPosition + trimmedChunk.length,
              length: trimmedChunk.length,
              pageNumber: pageNumber,
            },
          };
        }

        const actualLength = chunkText.length;
        const slideAmount = Math.max(actualLength - overlap, 0);
        if (slideAmount === 0) {
          break;
        }
        buffer = buffer.slice(slideAmount);
        globalPosition += slideAmount;

        if (buffer.length < chunkSize && i + SEGMENT_SIZE < markdown.length) {
          break;
        }
      }
    }

    if (buffer.trim().length > 0) {
      const pageNumber = this.determineChunkPageNumber(globalPosition, pagePositions);
      console.log(`[Chunking] Final chunk ${chunkIndex}: position ${globalPosition}, pageNumber: ${pageNumber ?? 'null'}`);
      
      yield {
        content: buffer.trim(),
        index: chunkIndex,
        metadata: {
          startChar: globalPosition,
          endChar: globalPosition + buffer.length,
          length: buffer.length,
          pageNumber: pageNumber,
        },
      };
    }    
    console.log(`[Chunking] Stream complete: Generated ${chunkIndex} chunks total`);    
    console.log(`[Chunking] Stream complete: Generated ${chunkIndex} chunks total`);
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
    
    const pdfPageRegex = /<!-- Page (\d+) -->/g;
    let match;
    while ((match = pdfPageRegex.exec(content)) !== null) {
      pagePositions.push({
        position: match.index,
        pageNumber: parseInt(match[1], 10),
      });
    }
    
    if (pagePositions.length > 0) {
      console.log(`[Chunking] Found ${pagePositions.length} PDF page markers`);
      return pagePositions;
    }
    
    const slideRegex = /<!-- Slide number: (\d+) -->/g;
    while ((match = slideRegex.exec(content)) !== null) {
      pagePositions.push({
        position: match.index,
        pageNumber: parseInt(match[1], 10),
      });
    }
    
    if (pagePositions.length > 0) {
      console.log(`[Chunking] Found ${pagePositions.length} slide markers`);
      return pagePositions;
    }
    
    const sheetRegex = /^# Sheet (\d+)/gm;
    while ((match = sheetRegex.exec(content)) !== null) {
      pagePositions.push({
        position: match.index,
        pageNumber: parseInt(match[1], 10),
      });
    }
    
    if (pagePositions.length > 0) {
      console.log(`[Chunking] Found ${pagePositions.length} sheet markers`);
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
