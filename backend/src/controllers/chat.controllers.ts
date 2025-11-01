import { Response } from 'express';
import { AuthRequest } from '../types/express';
import prisma from '../prisma/client';
import {
  CreateSessionRequest,
  CreateSessionResponse,
  SendMessageRequest,
  SendMessageResponse,
  SessionDetails,
  UploadFileResponse,
} from '../types/chat.types';
import path from 'path';
import { UPLOAD_DIR } from '../config/upload';
import { jobQueue } from '../queue';
import { sseService } from '../services/sse.service';

class ChatController {
  static async createSession(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { title }: CreateSessionRequest = req.body;

    try {
      const session = await prisma.chatSession.create({
        data: {
          userId,
          title: title || 'New Chat',
        },
      });

      const response: CreateSessionResponse = {
        sessionId: session.id,
        title: session.title || undefined,
        createdAt: session.createdAt,
      };

      return res.status(201).json(response);
    } catch (error) {
      console.error('[chat] Error creating session:', error);
      return res.status(500).json({ error: 'Failed to create chat session' });
    }
  }

  static async getSessions(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const sessions = await prisma.chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return res.status(200).json({ sessions });
    } catch (error) {
      console.error('[chat] Error fetching sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  }

  static async getSessionById(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    try {
      const session = await prisma.chatSession.findUnique({
        where: { id, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              attachments: true,
            },
          },
        },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const response: SessionDetails = {
        id: session.id,
        title: session.title || undefined,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messages: session.messages.map((msg) => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          tokens: msg.tokens || undefined,
          createdAt: msg.createdAt,
          attachments: msg.attachments.map((att) => ({
            id: att.id,
            type: att.type,
            url: att.url,
            filename: att.filename,
            mimeType: att.mimeType,
            size: att.size,
            metadata: att.metadata || undefined,
          })),
        })),
      };

      return res.status(200).json(response);
    } catch (error) {
      console.error('[chat] Error fetching session:', error);
      return res.status(500).json({ error: 'Failed to fetch session' });
    }
  }

  static async deleteSession(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    try {
      const session = await prisma.chatSession.findUnique({
        where: { id, userId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      await prisma.chatSession.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error('[chat] Error deleting session:', error);
      return res.status(500).json({ error: 'Failed to delete session' });
    }
  }

  /**
   * Send message (creates user message and triggers LLM response)
   */
  static async sendMessage(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id: sessionId } = req.params;
    const { content, attachmentIds }: SendMessageRequest = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    try {
      // verify session belongs to user
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const userMessage = await prisma.message.create({
        data: {
          sessionId,
          role: 'user',
          content: content.trim(),
          attachments: attachmentIds
            ? {
                connect: attachmentIds.map((id) => ({ id })),
              }
            : undefined,
        },
      });

      // update session timestamp
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      const response: SendMessageResponse = {
        messageId: userMessage.id,
        content: userMessage.content,
        role: 'user',
        createdAt: userMessage.createdAt,
      };

      return res.status(201).json(response);

      // TODO: Trigger LLM response generation in background
    } catch (error) {
      console.error('[chat] Error sending message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  }

  /**
   * SSE endpoint for streaming 
   */
  static async streamResponse(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id: sessionId } = req.params;

    try {
      // verify session belongs to user
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId },
      });

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

      // TODO: Implement actual LLM streaming logic
      const mockResponse = 'This is a mock LLM response. Actual LLM integration coming soon.';

      const assistantMessage = await prisma.message.create({
        data: {
          sessionId,
          role: 'assistant',
          content: mockResponse,
        },
      });

      for (const char of mockResponse) {
        res.write(`data: ${JSON.stringify({ type: 'token', content: char })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate streaming delay
      }

      res.write(
        `data: ${JSON.stringify({ type: 'done', messageId: assistantMessage.id })}\n\n`
      );

      res.end();
    } catch (error) {
      console.error('[chat] Error in stream:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`);
      res.end();
    }
  }

  static async uploadFile(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;

    try {
      // Determine file type based on mimetype
      let fileType = 'document';
      if (file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (file.mimetype === 'application/pdf') {
        fileType = 'pdf';
      } else if (
        file.mimetype.includes('word') ||
        file.mimetype.includes('document')
      ) {
        fileType = 'document';
      } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
        fileType = 'spreadsheet';
      } else if (file.mimetype.includes('presentation') || file.mimetype.includes('powerpoint')) {
        fileType = 'presentation';
      }

      const attachment = await prisma.attachment.create({
        data: {
          type: fileType,
          url: path.join('uploads', file.filename),
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            storedFilename: file.filename,
            processed: false,
          },
        },
      });

      // queue the file for processing
      const jobId = jobQueue.add('process-file', {
        attachmentId: attachment.id,
        userId,
      }).catch((err: Error) => {
        console.error(`[chat] Failed to queue file processing: ${err.message}`);
      });

      const response: UploadFileResponse = {
        attachmentId: attachment.id,
        filename: attachment.filename,
        type: attachment.type,
        url: attachment.url,
      };

      console.log(`[chat] File uploaded: ${attachment.filename} (${attachment.id})`);
      return res.status(201).json(response);
    } catch (error) {
      console.error('[chat] Error uploading file:', error);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  /**
   * Get attachment processing status
   */
  static async getAttachmentStatus(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { attachmentId } = req.params;

      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      const metadata = attachment.metadata as any;
      const processed = metadata?.processed || false;
      const error = metadata?.error;
      const chunkCount = metadata?.chunkCount;

      return res.status(200).json({
        attachmentId: attachment.id,
        filename: attachment.filename,
        processed,
        error,
        chunkCount,
        processedAt: metadata?.processedAt,
        failedAt: metadata?.failedAt,
      });
    } catch (error) {
      console.error('[chat] Error getting attachment status:', error);
      return res.status(500).json({ error: 'Failed to get attachment status' });
    }
  }

  static async streamAttachmentStatus(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { attachmentId } = req.params;

    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      sseService.addClient(attachmentId, res);

      console.log(`[chat] SSE stream started for attachment: ${attachmentId}`);
    } catch (error) {
      console.error('[chat] Error starting SSE stream:', error);
      return res.status(500).json({ error: 'Failed to start stream' });
    }
  }
}

export { ChatController };
