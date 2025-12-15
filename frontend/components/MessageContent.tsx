import { Fragment, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import { parseContentSegments } from '@/lib/citation-parser';
import { markdownComponents } from '@/lib/markdown-config';
import { CitationButton } from './CitationButton';

interface MessageContentProps {
  content: string;
  onCitationClick?: (filename: string, page: number) => void;
}

export function MessageContent({ content, onCitationClick }: MessageContentProps) {
  const contentSegments = useMemo(() => {
    if (!content) return [];
    return parseContentSegments(content);
  }, [content]);

  if (!content || contentSegments.length === 0) {
    return <p className="text-muted-foreground italic">No content</p>;
  }

  return (
    <div className="inline">
      {contentSegments.map((segment, index) => {
        if (segment.type === 'text') {
          return (
            <span key={`text-${index}`} className="inline">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {segment.content}
              </ReactMarkdown>
            </span>
          );
        } else if (segment.type === 'citation' && segment.citation) {
          return (
            <CitationButton 
              key={`citation-${index}`}
              citation={segment.citation} 
              index={index}
              onCitationClick={onCitationClick}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
