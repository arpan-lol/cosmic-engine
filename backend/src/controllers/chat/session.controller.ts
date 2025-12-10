import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import {
  CreateSessionRequest,
  CreateSessionResponse,
  SessionDetails,
} from '../../types/chat.types';
import { CollectionService } from '../../services/milvus';
import { logger } from '../../utils/logger.util';
import { UnauthorizedError, NotFoundError, ProcessingError } from '../../types/errors';

export class SessionController {
  static async createSession(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const { title }: CreateSessionRequest = req.body;

    try {
      const session = await prisma.session.create({
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
      logger.error('SessionController', 'Error creating session', error instanceof Error ? error : undefined, { userId });
      next(new ProcessingError('Failed to create chat session'));
    }
  }

  static async getSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    try {
      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          chats: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return res.status(200).json({ sessions });
    } catch (error) {
      logger.error('SessionController', 'Error fetching sessions', error instanceof Error ? error : undefined, { userId });
      next(new ProcessingError('Failed to fetch sessions'));
    }
  }

  static async getSessionById(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const { id } = req.params;

    try {
      const session = await prisma.session.findUnique({
        where: { id, userId },
        include: {
          chats: {
            orderBy: { createdAt: 'asc' },
            include: {
              attachments: true,
            },
          },
        },
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const response: SessionDetails = {
        id: session.id,
        title: session.title || undefined,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messages: session.chats.map((msg) => ({
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
      logger.error('SessionController', 'Error fetching session', error instanceof Error ? error : undefined, { userId, sessionId: id });
      if (error instanceof NotFoundError) throw error;
      next(new ProcessingError('Failed to fetch session'));
    }
  }

  static async deleteSession(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const { id } = req.params;

    try {
      const session = await prisma.session.findUnique({
        where: { id, userId },
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      await prisma.session.delete({
        where: { id },
      });

      CollectionService.deleteCollection(id)
        .then(() => {
          logger.info('SessionController', `Deleted vectors for session: ${id}`);
        })
        .catch((error: Error) => {
          logger.warn('SessionController', `Failed to delete vectors for session ${id}`, { error: error.message });
        });

      return res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
      logger.error('SessionController', 'Error deleting session', error instanceof Error ? error : undefined, { userId, sessionId: id });
      if (error instanceof NotFoundError) throw error;
      next(new ProcessingError('Failed to delete session'));
    }
  }
}
