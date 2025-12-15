import { useEffect, useRef, useState } from 'react';
import { EngineEvent } from '@/lib/types';
import { toast } from 'sonner';

interface UseEngineEventsOptions {
  sessionId: string;
  onEvent?: (event: EngineEvent) => void;
  onError?: (error: Error) => void;
}

export function useEngineEvents({ sessionId, onEvent, onError }: UseEngineEventsOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onEventRef.current = onEvent;
    onErrorRef.current = onError;
  }, [onEvent, onError]);

  useEffect(() => {
    if (!sessionId) return;

    let isCleaningUp = false;

    const connect = async () => {
      if (isCleaningUp) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.cosmicengine.arpantaneja.dev';
      
      let token: string | null = null;
      try {
        const tokenResponse = await fetch('/api/auth/token');
        if (tokenResponse.ok) {
          const data = await tokenResponse.json();
          token = data.token;
        }
      } catch (error) {
        console.error('[EngineEvents] Failed to get token:', error);
      }

      const url = token 
        ? `${apiUrl}/chat/sessions/${sessionId}/events?token=${encodeURIComponent(token)}`
        : `${apiUrl}/chat/sessions/${sessionId}/events`;

      console.log('[EngineEvents] Connecting to event stream:', url.replace(/token=[^&]+/, 'token=***'));

      const eventSource = new EventSource(url, {
        withCredentials: true,
      });

      eventSource.onopen = () => {
        console.log('[EngineEvents] Connected to event stream');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (e) => {
        try {
          const event: EngineEvent = JSON.parse(e.data);
          console.log('[EngineEvents] Received event:', event);
          
          onEventRef.current?.(event);
        } catch (error) {
          console.error('[EngineEvents] Failed to parse event:', error);
        }
      };

      eventSource.onerror = () => {
        console.error('[EngineEvents] Connection error, readyState:', eventSource.readyState);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('[EngineEvents] Connection closed by server');
        }
        
        setIsConnected(false);
        eventSource.close();

        if (isCleaningUp) {
          console.log('[EngineEvents] Cleanup in progress, not reconnecting');
          return;
        }

        const maxRetries = 5;
        const baseDelay = 2000;
        const maxDelay = 30000;

        if (reconnectAttemptsRef.current < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current), maxDelay);
          
          console.log(`[EngineEvents] Will reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxRetries})`);
          
          if (reconnectAttemptsRef.current === 0) {
            toast.error('Connection to server lost. Reconnecting...', {
              duration: 5000,
            });
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isCleaningUp) {
              reconnectAttemptsRef.current++;
              connect();
            }
          }, delay);
        } else {
          console.error('[EngineEvents] Max reconnection attempts reached');
          toast.error('Failed to connect to server. Please refresh the page.', {
            duration: 5000,
          });
          onErrorRef.current?.(new Error('Max reconnection attempts reached'));
        }
      };

      eventSourceRef.current = eventSource;
    };

    connect();

    return () => {
      console.log('[EngineEvents] Cleaning up connection');
      isCleaningUp = true;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [sessionId]);

  return { isConnected };
}
