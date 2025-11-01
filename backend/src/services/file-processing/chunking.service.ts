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
  private static extractPageNumbers(content: string): PagePosition[] {
    const pagePositions: PagePosition[] = [];

    const slideRegex = /<!-- Slide number: (\d+) -->/g;
    let match;
    while ((match = slideRegex.exec(content)) !== null) {
      pagePositions.push({
        position: match.index,
        pageNumber: parseInt(match[1], 10),
      });
    }
    if (pagePositions.length > 0) {
      return pagePositions;
    }

    const sheetRegex = /^# Sheet (\d+)/gm;
    while ((match = sheetRegex.exec(content)) !== null) {
      pagePositions.push({
        position: match.index,
        pageNumber: parseInt(match[1], 10),
      });
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

  static async chunkContent(
    markdown: string,
    options: ChunkOptions = {}
  ): Promise<Chunk[]> {
    const { chunkSize = 4000, overlap = 200 } = options;

    console.log(
      `[Chunking] Splitting content (${markdown.length} chars) with size=${chunkSize}, overlap=${overlap}`
    );

    if (!markdown || markdown.trim().length === 0) {
      return [];
    }

    // Extract page positions from content
    const pagePositions = this.extractPageNumbers(markdown);

    // Split the content
    const rawChunks = this.splitText(markdown, chunkSize, overlap);

    // Create final chunks with page numbers
    const chunks: Chunk[] = rawChunks.map((rawChunk, index) => {
      const pageNumber = this.determineChunkPageNumber(
        rawChunk.startIndex,
        pagePositions
      );

      return {
        content: rawChunk.content,
        index,
        metadata: {
          startChar: rawChunk.startIndex,
          endChar: rawChunk.startIndex + rawChunk.content.length,
          length: rawChunk.content.length,
          pageNumber,
        },
      };
    });

    console.log(`[Chunking] Created ${chunks.length} chunks`);
    return chunks;
  }
}
