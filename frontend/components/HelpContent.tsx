'use client';

import ReactMarkdown from 'react-markdown';

interface HelpContentProps {
  content: string;
}

export function HelpContent({ content }: HelpContentProps) {
  return (
    <div className="prose prose-invert text-sm whitespace-pre-wrap">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
