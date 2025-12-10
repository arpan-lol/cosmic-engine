'use client';

import { Message } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Paperclip, Loader2, FileText, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface ChatMessageProps {
  message: Message;
  userAvatar?: string;
  userName?: string;
  isLoading?: boolean;
  onCitationClick?: (filename: string, page?: number) => void;
}

interface Citation {
  text: string;
  filename: string;
  pages: number[];
}

function parseCitations(text: string): (string | Citation)[] {
  const citationRegex = /\[SOURCE:\s*([^\|\]]+?)\s*\|\s*([^\]]+)\]/gi;
  const parts: (string | Citation)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const filename = match[1].trim();
    const pagesText = match[2].trim();
    
    const pageNumbers: number[] = [];
    const numberMatches = pagesText.matchAll(/\d+/g);
    for (const numMatch of numberMatches) {
      pageNumbers.push(parseInt(numMatch[0], 10));
    }

    parts.push({
      text: match[0],
      filename,
      pages: pageNumbers.length > 0 ? pageNumbers : [1],
    });

    lastIndex = match.index + match[0].length;
    
    if (lastIndex < text.length && /[.,;:!?]/.test(text[lastIndex])) {
      lastIndex++;
    }
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export default function ChatMessage({ message, userAvatar, userName, isLoading, onCitationClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContentWithCitations = (content: string) => {
    const parts = parseCitations(content);
    
    return parts.map((part, index) => {
      if (typeof part === 'string') {
        return <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            code: ({ node, inline, className, children, ...props }: any) => (
              inline ? (
                <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            ),
            pre: ({ children, ...props }: any) => (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto" {...props}>
                {children}
              </pre>
            ),
            a: ({ children, ...props }: any) => (
              <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            ),
            table: ({ children, ...props }: any) => (
              <div className="overflow-x-auto">
                <table className="border-collapse border border-border" {...props}>
                  {children}
                </table>
              </div>
            ),
            th: ({ children, ...props }: any) => (
              <th className="border border-border px-4 py-2 bg-muted" {...props}>
                {children}
              </th>
            ),
            td: ({ children, ...props }: any) => (
              <td className="border border-border px-4 py-2" {...props}>
                {children}
              </td>
            ),
          }}
        >
          {part}
        </ReactMarkdown>;
      } else {
        const isPDF = part.filename.toLowerCase().endsWith('.pdf');
        
        if (!isPDF) {
          return null;
        }
        
        const firstPage = part.pages[0];
        const displayText = part.pages.length > 1 
          ? `${part.filename.split('.')[0]} (${part.pages.length} refs)` 
          : `${part.filename.split('.')[0]} - p.${firstPage}`;
        
        return (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-1 mx-1 h-6 text-xs"
            onClick={() => onCitationClick?.(part.filename, firstPage)}
            title={`${part.filename}${part.pages.length > 1 ? ` (Pages: ${part.pages.join(', ')})` : ` - Page ${firstPage}`}`}
          >
            <FileText className="h-3 w-3" />
            {displayText}
          </Button>
        );
      }
    });
  };

  return (
    <div
      className={cn(
        'mb-4',
        isUser && 'flex gap-3 items-start justify-end',
        !isUser && 'flex flex-col gap-2'
      )}
    >
      {!isUser && (
        <>
          <div className="flex gap-3 items-start">
            <div className="h-8 w-8 flex-shrink-0">
              <Image src="/logo.png" alt="AI" width={28} height={28} className="h-8 w-8" />
            </div>
            <Card className="max-w-[80%] border-0 shadow-none bg-muted/50">
              <CardContent className="p-3">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {renderContentWithCitations(message.content)}
                  </div>
                )}

                <div
                  className="text-xs mt-2 text-muted-foreground"
                  title={new Date(message.createdAt).toLocaleString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                >
                  {new Date(message.createdAt).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!isUser && !isLoading && message.content && (
        <div className="ml-11">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      )}

      {isUser && (
        <>
          <Card
            className={cn(
              'max-w-[80%] border-0 shadow-none',
              'bg-primary text-primary-foreground'
            )}
          >
            <CardContent className="p-3">
              <div className="whitespace-pre-wrap break-words">{message.content}</div>
              
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 text-sm p-2 rounded border border-primary-foreground/20"
                    >
                      <Paperclip className="h-4 w-4" />
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate"
                      >
                        {attachment.filename}
                      </a>
                      <span className="text-xs text-primary-foreground/60">
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="text-xs mt-2 text-primary-foreground/60"
                title={new Date(message.createdAt).toLocaleString('en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              >
                {new Date(message.createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            </CardContent>
          </Card>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={userAvatar} alt={userName || 'User'} />
            <AvatarFallback>{userName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </>
      )}
    </div>
  );
}
