export interface Citation {
  text: string;
  filename: string;
  pages: number[];
  startIndex: number;
  endIndex: number;
}

export interface ContentSegment {
  type: 'text' | 'citation';
  content: string;
  citation?: Citation;
}
