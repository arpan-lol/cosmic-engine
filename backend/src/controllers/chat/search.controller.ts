import { Response } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import { CollectionService, SearchService } from '../../services/file-processing/milvus';

export class SearchController {
  /**
   * Search within a session's documents
   */
  static async searchSession(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id: sessionId } = req.params;
    const { query, topK = 10 } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    try {
      // Verify session belongs to user
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Get session stats
      const stats = await CollectionService.getStats(sessionId);

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
        results: results.map((r: { content: string; metadata: any; score: number }) => ({
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
      console.error('[chat] Error searching session:', error);
      return res.status(500).json({ error: 'Failed to search session' });
    }
  }
}
