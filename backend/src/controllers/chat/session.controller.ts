import { Response } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import {
  CreateSessionRequest,
  CreateSessionResponse,
  SessionDetails,
} from '../../types/chat.types';
import { CollectionService } from '../../services/file-processing/milvus';

export class SessionController {
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

      // Delete session from database (cascades to messages and attachments)
      await prisma.chatSession.delete({
        where: { id },
      });

      // Delete vectors from Milvus (async, don't block response)
      CollectionService.deleteCollection(id)
        .then(() => {
          console.log(`[chat] ✅ Deleted vectors for session: ${id}`);
        })
        .catch((error: Error) => {
          console.error(`[chat] ⚠️ Failed to delete vectors for session ${id}:`, error);
          // Don't fail the request if vector deletion fails
        });

      return res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
      console.error('[chat] Error deleting session:', error);
      return res.status(500).json({ error: 'Failed to delete session' });
    }
  }
}
