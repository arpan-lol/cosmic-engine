import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import { CollectionService, SearchService } from '../../services/milvus';
import { logger } from '../../utils/logger.util';
import { UnauthorizedError, NotFoundError, ValidationError, ProcessingError } from '../../types/errors';

export class SearchController {
  static async searchSession(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const { id: sessionId } = req.params;
    const { query, topK = 10 } = req.body;

    if (!query?.trim()) {
      throw new ValidationError('Search query is required');
    }

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      // Get session stats
      const stats = await CollectionService.getCollectionStats(sessionId);

      if (!stats.collectionExists || stats.totalVectors === 0) {
        return res.status(200).json({
          results: [],
          stats: {
            totalVectors: 0,
            query: query.trim(),
          },
          message: 'No documents have been uploaded to this session yet',
        });
      }

      // Perform semantic search
      const results = await SearchService.search(
        sessionId,
        query.trim(),
        topK
      );

      return res.status(200).json({
        results: results.map((r: { content: string; metadata?: any; score: number }) => ({
          content: r.content,
          score: r.score,
          metadata: {
            attachmentId: r.metadata?.attachmentId,
            chunkIndex: r.metadata?.chunkIndex,
            pageNumber: r.metadata?.pageNumber,
          },
        })),
        stats: {
          totalVectors: stats.totalVectors,
          resultsReturned: results.length,
          query: query.trim(),
        },
      });
    } catch (error) {
      logger.error('SearchController', 'Error searching session', error instanceof Error ? error : undefined, { sessionId, userId, query });
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      next(new ProcessingError('Failed to search session'));
    }
  }
}
