import { Request, Response } from 'express';
import { AuthRequest } from '../../types/express'
import { UnauthorizedError } from '../../types/errors';
import prisma from '../../prisma/client';

export class CacheController {
  static async getCache(req: AuthRequest, res: Response): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    try {
      // Get all sessions for the user first
      const userSessions = await prisma.session.findMany({
        where: { userId },
        select: { id: true },
      });
      const sessionIds = userSessions.map(s => s.id);

      // Get all cache entries for the user's sessions
      const cacheEntries = await prisma.queryRequestCache.findMany({
        where: {
          sessionId: { in: sessionIds },
        },
        orderBy: {
          lastSeenAt: 'desc',
        },
      });

      // Get session titles and attachment names for each cache entry
      const cacheWithDetails = await Promise.all(
        cacheEntries.map(async (entry) => {
          // Get session title
          const session = await prisma.session.findUnique({
            where: { id: entry.sessionId },
            select: { title: true },
          });

          const attachmentNames: string[] = [];
          if (entry.attachments && entry.attachments.length > 0) {
            const attachments = await prisma.attachment.findMany({
              where: { id: { in: entry.attachments } },
              select: { filename: true },
            });
            attachmentNames.push(...attachments.map(att => att.filename));
          }

          return {
            id: entry.id,
            cacheKey: entry.cacheKey,
            sessionId: entry.sessionId,
            sessionTitle: session?.title || 'Untitled',
            query: entry.query,
            attachmentNames,
            options: entry.options,
            createdAt: entry.createdAt,
            lastSeenAt: entry.lastSeenAt,
          };
        })
      );

      return res.status(200).json({ cache: cacheWithDetails });
    } catch (error) {
      console.error('Error fetching cache:', error);
      throw error;
    }
  }
}