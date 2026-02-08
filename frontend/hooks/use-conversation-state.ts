import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConversation } from './use-conversations';
import { useStreamMessage } from './use-stream-message';
import { useEngineEvents } from './use-engine-events';
import { useSearchOptions } from './use-search-options';
import { toast } from 'sonner';
import type { Message, EngineEvent, Attachment } from '@/lib/types';

interface UseConversationStateOptions {
  sessionId: string;
  sessionAttachments?: Attachment[];
  selectedContextIds: string[];
}

export function useConversationState({
  sessionId,
  sessionAttachments,
  selectedContextIds,
}: UseConversationStateOptions) {
  const queryClient = useQueryClient();
  const { options: searchOptions } = useSearchOptions();

  const { data: conversation, isLoading } = useConversation(sessionId);
  const { sendMessage, isStreaming, isComplete, streamedContent, error, reset } = useStreamMessage();

  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [allLogs, setAllLogs] = useState<EngineEvent[]>([]);
  const [displayTitle, setDisplayTitle] = useState('');
  const [isTypingTitle, setIsTypingTitle] = useState(false);
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const displayMessages = useMemo(() => {
    const messages = [...optimisticMessages];
    if ((isStreaming || isComplete) && streamedContent) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant') {
        messages[messages.length - 1] = { ...lastMsg, content: streamedContent };
      }
    }
    return messages;
  }, [optimisticMessages, isStreaming, isComplete, streamedContent]);

  const handleEngineEvent = useCallback((event: EngineEvent) => {
    if (event.type === 'title-update' && event.newTitle) {
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
      setIsTypingTitle(true);
      let currentIndex = 0;
      const targetTitle = event.newTitle;

      titleIntervalRef.current = setInterval(() => {
        currentIndex++;
        setDisplayTitle(targetTitle.slice(0, currentIndex));

        if (currentIndex >= targetTitle.length) {
          if (titleIntervalRef.current) {
            clearInterval(titleIntervalRef.current);
            titleIntervalRef.current = null;
          }
          setIsTypingTitle(false);
          queryClient.invalidateQueries({ queryKey: ['conversation', sessionId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      }, 50);

      return;
    }

    if (event.scope === 'session') {
      setAllLogs(prev => [...prev, event]);
    } else if (event.scope === 'user') {
      toast(event.message, {
        description: event.data?.title,
        duration: 10000,
      });
    }
  }, [sessionId, queryClient]);

  useEngineEvents({
    sessionId,
    onEvent: handleEngineEvent,
    onError: (error) => {
      console.error('[EngineEvents] Connection error:', error);
    },
  });

  useEffect(() => {
    return () => {
      if (titleIntervalRef.current) {
        clearInterval(titleIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isStreaming || displayMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [streamedContent, displayMessages.length, isStreaming]);

  useEffect(() => {
    if (conversation?.messages) {
      const regularMessages: Message[] = [];
      const logs: EngineEvent[] = [];

      conversation.messages.forEach(msg => {
        if (msg.role === 'system') {
          try {
            const event = JSON.parse(msg.content) as EngineEvent;
            logs.push(event);
          } catch (error) {
            console.error('[Session] Failed to parse system message:', error);
          }
        } else {
          regularMessages.push(msg);
        }
      });

      const serverMessageCount = regularMessages.length;
      const currentMessageCount = optimisticMessages.length;

      if (serverMessageCount >= currentMessageCount) {
        setOptimisticMessages(regularMessages);
        setSeenMessageIds(new Set(regularMessages.map(m => m.id)));
        if (isComplete && serverMessageCount > currentMessageCount) {
          reset();
        }
      }
      setAllLogs(prev => {
        const existingTimestamps = new Set(logs.map(l => l.timestamp));
        const sseOnlyLogs = prev.filter(l => !existingTimestamps.has(l.timestamp));
        return [...logs, ...sseOnlyLogs];
      });
    }
  }, [conversation?.messages, isStreaming, isComplete, optimisticMessages.length, reset]);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMsg: Message = {
      id: `temp-user-${Date.now()}`,
      sessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      attachments: sessionAttachments?.filter((att: Attachment) =>
        selectedContextIds.includes(att.id)
      ) || [],
    };

    const assistantMsgId = `temp-assistant-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      sessionId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setOptimisticMessages(prev => [...prev, userMsg, assistantMsg]);
    setSeenMessageIds(prev => new Set([...prev, userMsg.id, assistantMsgId]));

    await sendMessage(sessionId, content, {
      attachmentIds: selectedContextIds.length > 0 ? selectedContextIds : undefined,
      bm25: searchOptions.hybridSearch,
      rrf: searchOptions.rrfSearch,
      caching: searchOptions.caching,
      queryExpansion: searchOptions.queryExpansion,
      onComplete: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations', sessionId] });
      },
      onError: (error) => {
        console.error('Error sending message:', error);
        setOptimisticMessages(prev => prev.filter(msg => msg.id !== assistantMsgId));
      },
    });
  }, [sessionId, sessionAttachments, selectedContextIds, sendMessage, searchOptions, queryClient]);

  const isLoadingResponse = isStreaming && !streamedContent;

  return {
    conversation,
    isLoading,
    displayMessages,
    allLogs,
    displayTitle,
    isTypingTitle,
    seenMessageIds,
    messagesEndRef,
    isStreaming,
    isComplete,
    streamedContent,
    error,
    isLoadingResponse,
    handleSendMessage,
    reset,
  };
}
