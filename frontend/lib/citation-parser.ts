import type { ContentSegment } from './citation-types';

const CITATION_REGEX = /\[SOURCE:\s*([^\|\]]+?)\s*\|\s*([^\]]+)\]/gi;

export function parseContentSegments(text: string): ContentSegment[] {
  if (!text || typeof text !== 'string') {
    return [{ type: 'text', content: '' }];
  }

  const segments: ContentSegment[] = [];
  const matches = Array.from(text.matchAll(CITATION_REGEX));

  if (matches.length === 0) {
    return [{ type: 'text', content: text }];
  }

  let lastIndex = 0;

  for (const match of matches) {
    if (match.index === undefined) continue;

    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    const filename = match[1]?.trim();
    const pagesText = match[2]?.trim();

    if (!filename) {
      lastIndex = match.index + match[0].length;
      continue;
    }

    const pageNumbers: number[] = [];
    const numberMatches = Array.from(pagesText.matchAll(/\d+/g));
    for (const numMatch of numberMatches) {
      const pageNum = parseInt(numMatch[0], 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        pageNumbers.push(pageNum);
      }
    }

    segments.push({
      type: 'citation',
      content: match[0],
      citation: {
        text: match[0],
        filename,
        pages: pageNumbers,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      },
    });

    lastIndex = match.index + match[0].length;
    
    if (lastIndex < text.length && /^[.,;:!?]/.test(text[lastIndex])) {
      lastIndex++;
    }
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return segments;
}

export function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function getFilenameWithoutExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : filename;
}

export function truncateFilename(filename: string, maxLength: number = 30): string {
  if (!filename || filename.length <= maxLength) return filename;
  const ext = getFileExtension(filename);
  const nameWithoutExt = getFilenameWithoutExtension(filename);
  const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 4) + '...';
  return ext ? `${truncated}.${ext}` : truncated;
}
