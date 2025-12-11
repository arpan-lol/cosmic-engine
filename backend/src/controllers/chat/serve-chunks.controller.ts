import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import { SearchService } from '../../services/milvus';
import prisma from '../../prisma/client';
import { UnauthorizedError, NotFoundError, ValidationError, ProcessingError } from '../../types/errors';
import { logger } from '../../utils/logger.util';

export class ChunksController {
  static async getChunks(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const { id: sessionId } = req.params;

    if (!req.body.attachmentId?.trim()) {
      throw new ValidationError('Attachment ID is required');
    }

    try {
      const { attachmentId } = req.body;
      const session = await prisma.session.findUnique({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        throw new NotFoundError('Attachment not found');
      }

      const chunks = await SearchService.getAllChunks(sessionId, attachmentId);

      return res.status(200).json({
        chunks,
        total: chunks.length,
        attachmentId,
        filename: attachment.filename,
      });
    } catch (error) {
      logger.error('ChunksController', 'Error retrieving chunks', error instanceof Error ? error : undefined, { sessionId, userId });
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      next(new ProcessingError('Failed to retrieve chunks'));
    }
  }
}
