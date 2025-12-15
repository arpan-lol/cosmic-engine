import { Response } from 'express';
import prisma from '../prisma/client';

interface ProgressClient {
  res: Response;
  attachmentId: string;
}

interface SessionClient {
  res: Response;
  userId: number;
  sessionId: string;
}

export interface EngineEvent {
  type: 'notification' | 'success' | 'error' | 'title-update';
  scope: 'session' | 'user';
  sessionId?: string;
  message: string;
  showInChat: boolean;
  attachmentId?: string;
  actionType?: 'view-chunks';
  data?: {
    title: string;
    body: string[];
  };
  newTitle?: string;
  timestamp: string;
}

class SSEService {
  private progressClients: Map<string, ProgressClient[]> = new Map();
  private sessionClients: Map<string, SessionClient[]> = new Map();
  private keepAliveIntervals: Map<string, NodeJS.Timeout> = new Map();

  private setupSSEHeaders(res: Response) {
    const origin = process.env.FRONTEND_ORIGIN || 'https://cosmicengine.arpantaneja.dev';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
  }

  private sendSSE(res: Response, data: any): boolean {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      res.write(message);
      return true;
    } catch (error) {
      console.error(`[SSE] Error sending to client:`, error);
      return false;
    }
  }

  // FILE PROCESSING STREAMS - Per-attachment, short-lived

  addProgressClient(attachmentId: string, res: Response) {
    this.setupSSEHeaders(res);

    const clients = this.progressClients.get(attachmentId) || [];
    clients.push({ res, attachmentId });
    this.progressClients.set(attachmentId, clients);

    console.log(`[SSE] Client connected for attachment: ${attachmentId} (total: ${clients.length})`);

    this.sendProgress(attachmentId, {
      status: 'connected',
      message: 'indexing...',
    });

    res.on('close', () => {
      this.removeProgressClient(attachmentId, res);
    });
  }

  private removeProgressClient(attachmentId: string, res: Response) {
    const clients = this.progressClients.get(attachmentId);
    if (!clients) return;

    const filtered = clients.filter(client => client.res !== res);
    
    if (filtered.length === 0) {
      this.progressClients.delete(attachmentId);
      console.log(`[SSE] No more clients for attachment: ${attachmentId}`);
    } else {
      this.progressClients.set(attachmentId, filtered);
      console.log(`[SSE] Client disconnected for ${attachmentId} (remaining: ${filtered.length})`);
    }
  }

  sendProgress(attachmentId: string, data: any) {
    const clients = this.progressClients.get(attachmentId);
    if (!clients || clients.length === 0) return;

    clients.forEach(client => {
      const success = this.sendSSE(client.res, data);
      if (!success) {
        this.removeProgressClient(attachmentId, client.res);
      }
    });

    console.log(`[SSE] Sent to ${clients.length} client(s) for ${attachmentId}:`, data.status);
  }

  closeProgress(attachmentId: string) {
    const clients = this.progressClients.get(attachmentId);
    if (!clients) return;

    clients.forEach(client => {
      client.res.end();
    });

    this.progressClients.delete(attachmentId);
    console.log(`[SSE] Closed all connections for ${attachmentId}`);
  }

  // ENGINE EVENT STREAM, long lived event bus

  addSessionClient(userId: number, sessionId: string, res: Response) {
    this.setupSSEHeaders(res);

    const clientKey = `${userId}:${sessionId}`;
    const clients = this.sessionClients.get(clientKey) || [];
    clients.push({ res, userId, sessionId });
    this.sessionClients.set(clientKey, clients);

    console.log(`[EventStream] Client connected for session: ${sessionId} (userId: ${userId}, total: ${clients.length})`);

    this.sendSSE(res, {
      type: 'system',
      data: { status: 'connected', message: 'Connected to Engine Event Stream' },
      timestamp: new Date().toISOString(),
    });

    if (!this.keepAliveIntervals.has(clientKey)) {
      const interval = setInterval(() => {
        const currentClients = this.sessionClients.get(clientKey);
        if (currentClients && currentClients.length > 0) {
          currentClients.forEach(client => {
            try {
              res.write(':keep-alive\n\n');
            } catch (error) {
              console.error(`[EventStream] Keep-alive failed for ${clientKey}`);
            }
          });
        } else {
          const keepAlive = this.keepAliveIntervals.get(clientKey);
          if (keepAlive) {
            clearInterval(keepAlive);
            this.keepAliveIntervals.delete(clientKey);
          }
        }
      }, 30000);
      
      this.keepAliveIntervals.set(clientKey, interval);
    }

    res.on('close', () => {
      this.removeSessionClient(userId, sessionId, res);
    });
  }

  private removeSessionClient(userId: number, sessionId: string, res: Response) {
    const clientKey = `${userId}:${sessionId}`;
    const clients = this.sessionClients.get(clientKey);
    if (!clients) return;

    const filtered = clients.filter(client => client.res !== res);
    
    if (filtered.length === 0) {
      this.sessionClients.delete(clientKey);
      
      const keepAlive = this.keepAliveIntervals.get(clientKey);
      if (keepAlive) {
        clearInterval(keepAlive);
        this.keepAliveIntervals.delete(clientKey);
      }
      
      console.log(`[EventStream] No more clients for session: ${sessionId}`);
    } else {
      this.sessionClients.set(clientKey, filtered);
      console.log(`[EventStream] Client disconnected for ${sessionId} (remaining: ${filtered.length})`);
    }
  }

  async publishToSession(sessionId: string, event: EngineEvent) {
    const allClients = Array.from(this.sessionClients.entries());
    let sentCount = 0;

    const eventWithTimestamp = {
      ...event,
      scope: 'session' as const,
      sessionId,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    allClients.forEach(([clientKey, clients]) => {
      const [, clientSessionId] = clientKey.split(':');
      if (clientSessionId === sessionId) {
        clients.forEach(client => {
          const success = this.sendSSE(client.res, eventWithTimestamp);
          if (success) {
            sentCount++;
          } else {
            this.removeSessionClient(client.userId, client.sessionId, client.res);
          }
        });
      }
    });

    prisma.chat.create({
      data: {
        sessionId,
        role: 'system',
        content: JSON.stringify(eventWithTimestamp),
      },
    }).catch((err: any) => {
      console.error(`[EventStream] Failed to persist event to DB:`, err);
    });
  }

  publishToUser(userId: number, event: EngineEvent) {
    const allClients = Array.from(this.sessionClients.entries());
    let sentCount = 0;

    const eventWithTimestamp = {
      ...event,
      scope: 'user' as const,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    allClients.forEach(([clientKey, clients]) => {
      const [clientUserId] = clientKey.split(':');
      if (parseInt(clientUserId) === userId) {
        clients.forEach(client => {
          const success = this.sendSSE(client.res, eventWithTimestamp);
          if (success) {
            sentCount++;
          } else {
            this.removeSessionClient(client.userId, client.sessionId, client.res);
          }
        });
      }
    });
  }

  closeSession(sessionId: string) {
    const allClients = Array.from(this.sessionClients.entries());
    
    allClients.forEach(([clientKey, clients]) => {
      const [, clientSessionId] = clientKey.split(':');
      if (clientSessionId === sessionId) {
        clients.forEach(client => {
          client.res.end();
        });
        this.sessionClients.delete(clientKey);
      }
    });

    console.log(`[EventStream] Closed all connections for session: ${sessionId}`);
  }
}

export const sseService = new SSEService();
