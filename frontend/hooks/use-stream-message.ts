import { useState, useCallback } from 'react';
import type { SSEMessage } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006';

export const useStreamMessage = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (
      sessionId: string,
      content: string,
      options?: {
        attachmentIds?: string[];
        documentIds?: string[];
        bm25?: boolean;
        rrf?: boolean;
        onToken?: (token: string) => void;
        onComplete?: (messageId: string) => void;
        onError?: (error: string) => void;
      }
    ) => {
      setIsStreaming(true);
      setStreamedContent('');
      setError(null);

      try {
        let token: string | null = null;
        try {
          const tokenResponse = await fetch('/api/auth/token');
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            token = tokenData.token;
          }
        } catch (error) {
          console.error('Failed to get token:', error);
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const requestBody: any = {
          content,
          attachmentIds: options?.attachmentIds,
          documentIds: options?.documentIds,
        };

        if (options?.bm25 !== undefined) {
          requestBody.options = {
            bm25: options.bm25,
          };
        }

        console.log('[STREAM] Sending message with body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(
          `${API_BASE_URL}/chat/sessions/${sessionId}/message`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              try {
                const message: SSEMessage = JSON.parse(data);

                if (message.type === 'token' && message.content) {
                  setStreamedContent((prev) => prev + message.content);
                  options?.onToken?.(message.content);
                } else if (message.type === 'done' && message.messageId) {
                  options?.onComplete?.(message.messageId);
                } else if (message.type === 'error' && message.error) {
                  setError(message.error);
                  options?.onError?.(message.error);
                }
              } catch (e) {
                console.error('Failed to parse SSE message:', e);
              }
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        options?.onError?.(errorMessage);
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStreamedContent('');
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    sendMessage,
    isStreaming,
    streamedContent,
    error,
    reset,
  };
};
