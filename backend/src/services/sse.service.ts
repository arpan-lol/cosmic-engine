import { Response } from 'express';

interface AttachmentClient {
  res: Response;
  attachmentId: string;
}

interface SessionClient {
  res: Response;
  userId: number;
  sessionId: string;
}

export interface EngineEvent {
  type: 'notification' | 'error';
  sessionId?: string;
  data: any;
  timestamp: string;
}

class SSEService {
  private attachmentClients: Map<string, AttachmentClient[]> = new Map();
  private sessionClients: Map<string, SessionClient[]> = new Map();

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

  addClient(attachmentId: string, res: Response) {
    this.setupSSEHeaders(res);

    const clients = this.attachmentClients.get(attachmentId) || [];
    clients.push({ res, attachmentId });
    this.attachmentClients.set(attachmentId, clients);

    console.log(`[SSE] Client connected for attachment: ${attachmentId} (total: ${clients.length})`);

    this.sendToAttachment(attachmentId, {
      status: 'connected',
      message: 'Listening for updates...',
    });

    res.on('close', () => {
      this.removeAttachmentClient(attachmentId, res);
    });
  }

  private removeAttachmentClient(attachmentId: string, res: Response) {
    const clients = this.attachmentClients.get(attachmentId);
    if (!clients) return;

    const filtered = clients.filter(client => client.res !== res);
    
    if (filtered.length === 0) {
      this.attachmentClients.delete(attachmentId);
      console.log(`[SSE] No more clients for attachment: ${attachmentId}`);
    } else {
      this.attachmentClients.set(attachmentId, filtered);
      console.log(`[SSE] Client disconnected for ${attachmentId} (remaining: ${filtered.length})`);
    }
  }

  sendToAttachment(attachmentId: string, data: any) {
    const clients = this.attachmentClients.get(attachmentId);
    if (!clients || clients.length === 0) return;

    clients.forEach(client => {
      const success = this.sendSSE(client.res, data);
      if (!success) {
        this.removeAttachmentClient(attachmentId, client.res);
      }
    });

    console.log(`[SSE] Sent to ${clients.length} client(s) for ${attachmentId}:`, data.status);
  }

  closeAttachment(attachmentId: string) {
    const clients = this.attachmentClients.get(attachmentId);
    if (!clients) return;

    clients.forEach(client => {
      client.res.end();
    });

    this.attachmentClients.delete(attachmentId);
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
      console.log(`[EventStream] No more clients for session: ${sessionId}`);
    } else {
      this.sessionClients.set(clientKey, filtered);
      console.log(`[EventStream] Client disconnected for ${sessionId} (remaining: ${filtered.length})`);
    }
  }

  publishToSession(sessionId: string, event: EngineEvent) {
    const allClients = Array.from(this.sessionClients.entries());
    let sentCount = 0;

    allClients.forEach(([clientKey, clients]) => {
      const [, clientSessionId] = clientKey.split(':');
      if (clientSessionId === sessionId) {
        clients.forEach(client => {
          const success = this.sendSSE(client.res, {
            ...event,
            sessionId,
            timestamp: event.timestamp || new Date().toISOString(),
          });
          if (success) {
            sentCount++;
          } else {
            this.removeSessionClient(client.userId, client.sessionId, client.res);
          }
        });
      }
    });

    if (sentCount > 0) {
      console.log(`[EventStream] Published ${event.type} event to ${sentCount} client(s) for session ${sessionId}`);
    }
  }

  publishToUser(userId: number, event: EngineEvent) {
    const allClients = Array.from(this.sessionClients.entries());
    let sentCount = 0;

    allClients.forEach(([clientKey, clients]) => {
      const [clientUserId] = clientKey.split(':');
      if (parseInt(clientUserId) === userId) {
        clients.forEach(client => {
          const success = this.sendSSE(client.res, {
            ...event,
            timestamp: event.timestamp || new Date().toISOString(),
          });
          if (success) {
            sentCount++;
          } else {
            this.removeSessionClient(client.userId, client.sessionId, client.res);
          }
        });
      }
    });

    if (sentCount > 0) {
      console.log(`[EventStream] Published ${event.type} event to ${sentCount} client(s) for user ${userId}`);
    }
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
