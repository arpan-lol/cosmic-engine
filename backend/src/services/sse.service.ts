import { Response } from 'express';

interface SSEClient {
  res: Response;
  attachmentId: string;
}

class SSEService {
  private clients: Map<string, SSEClient[]> = new Map();

  addClient(attachmentId: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); 

    const clients = this.clients.get(attachmentId) || [];
    clients.push({ res, attachmentId });
    this.clients.set(attachmentId, clients);

    console.log(`[SSE] Client connected for attachment: ${attachmentId} (total: ${clients.length})`);

    this.sendToAttachment(attachmentId, {
      status: 'connected',
      message: 'Listening for updates...',
    });

    res.on('close', () => {
      this.removeClient(attachmentId, res);
    });
  }

  private removeClient(attachmentId: string, res: Response) {
    const clients = this.clients.get(attachmentId);
    if (!clients) return;

    const filtered = clients.filter(client => client.res !== res);
    
    if (filtered.length === 0) {
      this.clients.delete(attachmentId);
      console.log(`[SSE] No more clients for attachment: ${attachmentId}`);
    } else {
      this.clients.set(attachmentId, filtered);
      console.log(`[SSE] Client disconnected for ${attachmentId} (remaining: ${filtered.length})`);
    }
  }

  sendToAttachment(attachmentId: string, data: any) {
    const clients = this.clients.get(attachmentId);
    if (!clients || clients.length === 0) return;

    const message = `data: ${JSON.stringify(data)}\n\n`;
    
    clients.forEach(client => {
      try {
        client.res.write(message);
      } catch (error) {
        console.error(`[SSE] Error sending to client:`, error);
        this.removeClient(attachmentId, client.res);
      }
    });

    console.log(`[SSE] Sent to ${clients.length} client(s) for ${attachmentId}:`, data.status);
  }

  closeAttachment(attachmentId: string) {
    const clients = this.clients.get(attachmentId);
    if (!clients) return;

    clients.forEach(client => {
      client.res.end();
    });

    this.clients.delete(attachmentId);
    console.log(`[SSE] Closed all connections for ${attachmentId}`);
  }
}

export const sseService = new SSEService();
