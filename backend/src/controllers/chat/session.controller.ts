import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import {
  CreateSessionRequest,
  CreateSessionResponse,
  UpdateSessionRequest,
  UpdateSessionResponse,
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
          titleSource: title ? 'USER_PROVIDED' : 'DEFAULT',
        },
      });

      const response: CreateSessionResponse = {
        sessionId: session.id,
        title: session.title || undefined,
        titleSource: session.titleSource,
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
              attachments: {
                include: {
                  attachment: true,
                },
              },
              timeMetrics: true,
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
        titleSource: session.titleSource,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messages: session.chats.map((msg) => ({
          id: msg.id,
          sessionId: msg.sessionId,
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
          tokens: msg.tokens || undefined,
          createdAt: msg.createdAt,
          attachments: msg.attachments.map((chatAtt) => ({
            id: chatAtt.attachment.id,
            type: chatAtt.attachment.type,
            url: chatAtt.attachment.url,
            filename: chatAtt.attachment.filename,
            mimeType: chatAtt.attachment.mimeType,
            size: chatAtt.attachment.size,
            metadata: chatAtt.attachment.metadata || undefined,
          })),
          timeMetrics: msg.timeMetrics ? {
            id: msg.timeMetrics.id,
            chatId: msg.timeMetrics.chatId,
            totalRequestMs: msg.timeMetrics.totalRequestMs,
            queryExpansionMs: msg.timeMetrics.queryExpansionMs || undefined,
            retrievalMs: msg.timeMetrics.retrievalMs || undefined,
            embeddingMs: msg.timeMetrics.embeddingMs || undefined,
            vectorSearchMs: msg.timeMetrics.vectorSearchMs || undefined,
            bm25SearchMs: msg.timeMetrics.bm25SearchMs || undefined,
            rankingMs: msg.timeMetrics.rankingMs || undefined,
            hydrationMs: msg.timeMetrics.hydrationMs || undefined,
            perAttachmentMs: msg.timeMetrics.perAttachmentMs as Record<string, any> || undefined,
            promptBuildingMs: msg.timeMetrics.promptBuildingMs || undefined,
            firstTokenMs: msg.timeMetrics.firstTokenMs || undefined,
            streamingMs: msg.timeMetrics.streamingMs || undefined,
            total: msg.timeMetrics.total || undefined,
            createdAt: msg.timeMetrics.createdAt.toISOString(),
            isCached: msg.timeMetrics.isCached,
            cachedQuery: msg.timeMetrics.cachedQuery || undefined,
            cachedAttachmentNames: msg.timeMetrics.cachedAttachmentNames,
            cachedOptions: msg.timeMetrics.cachedOptions as any || undefined,
          } : undefined,
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

  static async updateSession(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const { id } = req.params;
    const { title }: UpdateSessionRequest = req.body;

    if (!title || title.trim().length === 0) {
      next(new ProcessingError('Title is required'));
      return;
    }

    if (title.length > 100) {
      next(new ProcessingError('Title must be 100 characters or less'));
      return;
    }

    try {
      const existingSession = await prisma.session.findUnique({
        where: { id, userId },
      });

      if (!existingSession) {
        throw new NotFoundError('Session not found');
      }

      const updatedSession = await prisma.session.update({
        where: { id },
        data: {
          title: title.trim(),
          titleSource: 'USER_EDITED',
        },
      });

      const response: UpdateSessionResponse = {
        id: updatedSession.id,
        title: updatedSession.title!,
        titleSource: updatedSession.titleSource,
        updatedAt: updatedSession.updatedAt,
      };

      return res.status(200).json(response);
    } catch (error) {
      logger.error('SessionController', 'Error updating session', error instanceof Error ? error : undefined, { userId, sessionId: id });
      if (error instanceof NotFoundError) throw error;
      next(new ProcessingError('Failed to update session'));
    }
  }
}
