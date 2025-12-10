import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { sseService } from '../services/sse.service';
import { logger } from '../utils/logger.util';
import { UnauthorizedError, NotFoundError, ProcessingError } from '../types/errors';
import prisma from '../prisma/client';

export class EventsController {
  static async streamSessionEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const { id: sessionId } = req.params;

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      sseService.addSessionClient(userId, sessionId, res);

      logger.info('EventsController', `Engine Event Stream started for session: ${sessionId}`, { userId, sessionId });
    } catch (error) {
      logger.error('EventsController', 'Error starting Engine Event Stream', error instanceof Error ? error : undefined, { sessionId, userId });
      if (error instanceof NotFoundError || error instanceof UnauthorizedError) throw error;
      next(new ProcessingError('Failed to start event stream'));
    }
  }
}
