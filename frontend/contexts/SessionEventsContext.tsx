"use client";

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { EngineEvent } from '@/lib/types';
import { toast } from 'sonner';

interface SessionEventsContextType {
  isConnected: boolean;
  lastEvent: EngineEvent | null;
}

const SessionEventsContext = createContext<SessionEventsContextType>({
  isConnected: false,
  lastEvent: null,
});

interface SessionEventsProviderProps {
  children: ReactNode;
  sessionId: string | null;
}

export function SessionEventsProvider({ children, sessionId }: SessionEventsProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<EngineEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
      setIsConnected(false);
      setLastEvent(null);
      return;
    }

    setLastEvent(null);
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

      if (isCleaningUp) {
        return;
      }

      const url = token
        ? `${apiUrl}/chat/sessions/${sessionId}/events?token=${encodeURIComponent(token)}`
        : `${apiUrl}/chat/sessions/${sessionId}/events`;

      const eventSource = new EventSource(url, {
        withCredentials: true,
      });

      eventSource.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (e) => {
        try {
          const event: EngineEvent = JSON.parse(e.data);
          setLastEvent(event);
        } catch (error) {
          console.error('[EngineEvents] Failed to parse event:', error);
        }
      };

      eventSource.onerror = () => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[EngineEvents] Connection error, readyState:', eventSource.readyState);
        }

        setIsConnected(false);
        eventSource.close();

        if (isCleaningUp) {
          return;
        }

        const maxRetries = 5;
        const baseDelay = 2000;
        const maxDelay = 30000;

        if (reconnectAttemptsRef.current < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current), maxDelay);

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
        }
      };

      eventSourceRef.current = eventSource;
    };

    connect();

    return () => {
      isCleaningUp = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
      setIsConnected(false);
    };
  }, [sessionId]);

  return (
    <SessionEventsContext.Provider value={{ isConnected, lastEvent }}>
      {children}
    </SessionEventsContext.Provider>
  );
}

export function useSessionEvents() {
  return useContext(SessionEventsContext);
}
