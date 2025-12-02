import { Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { HealthCheck } from '../utils/healthcheck.util';
import { ValidationError, NotFoundError, UnauthorizedError } from 'src/types/errors.js';
import prisma from 'src/prisma/client.js';
import { jobQueue } from '../queue/index.js';
import { logger } from '../utils/logger.util.js';

class BM25Controller {
  static async indexFiles(req: AuthRequest, res: Response): Promise<Response> {
    
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const { id: sessionId } = req.params;
    const { attachmentIds }: { attachmentIds: string[] } = req.body;    

    for (const attachment of attachmentIds) {
      const dbData = await prisma.attachment.findUnique({
        where: {
          id: attachment
        }
      })

      if (!dbData) {
        throw new NotFoundError(`Attachment ${attachment} not found`);
      }

      if (dbData.bm25indexStatus !== "not started") {
        throw new ValidationError("Some files have already been BM25 indexed or are queued");
      }
    }

    for (const attachmentId of attachmentIds) {
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: { bm25indexStatus: "queued" }
      });

      jobQueue.add('index-bm25', {
        attachmentId,
        userId,
        sessionId,
      }).catch((err: Error) => {
        logger.error('BM25Controller', 'Failed to queue BM25 indexing', err, { attachmentId, sessionId });
      });

      logger.info('BM25Controller', `BM25 indexing queued for attachment: ${attachmentId}`, { sessionId });
    }

    return res.status(200).json({ 
      status: 'success', 
      message: `Queued ${attachmentIds.length} file(s) for BM25 indexing`,
      queuedCount: attachmentIds.length,
    });
  }
}

export { BM25Controller }