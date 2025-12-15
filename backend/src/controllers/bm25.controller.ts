import { Response } from "express";
import { AuthRequest } from "../types/express.js";
import { ValidationError, NotFoundError, UnauthorizedError } from "src/types/errors.js";
import prisma from "src/prisma/client.js";
import { jobQueue } from "../queue/index.js";
import { logger } from "../utils/logger.util.js";
import { sseService } from "src/services/sse.service.js";

class BM25Controller {
  static async indexFiles(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const { id: sessionId } = req.params;
    const { attachmentIds }: { attachmentIds: string[] } = req.body;

    const attachments = await prisma.attachment.findMany({
      where: { id: { in: attachmentIds } }
    });

    if (attachments.length !== attachmentIds.length) {
      const foundIds = attachments.map(a => a.id);
      const missing = attachmentIds.filter(id => !foundIds.includes(id));
      throw new NotFoundError(`Missing attachments: ${missing.join(", ")}`);
    }

    for (const att of attachments) {
      if (att.bm25indexStatus !== "not started") {
        throw new ValidationError("Some files have already been BM25 indexed or are queued");
      }
    }

    for (const att of attachments) {
      await prisma.attachment.update({
        where: { id: att.id },
        data: { bm25indexStatus: "queued" }
      });

      jobQueue.add("index-bm25", {
        attachmentId: att.id,
        userId,
        sessionId
      }).catch((err: Error) => {
        logger.error(
          "BM25Controller",
          "Failed to queue BM25 indexing",
          err,
          { attachmentId: att.id, sessionId }
        );
      });

      await sseService.publishToSession(sessionId, {
        type: "notification",
        scope: "session",
        message: "New Job added",
        attachmentId: att.id,
        data: {
          title: `Added File ${att.filename} to BM25 indexing queue`,
          body: []
        },
        timestamp: new Date().toISOString()
      });

      logger.info(
        "BM25Controller",
        `BM25 indexing queued for attachment: ${att.id}`,
        { sessionId }
      );
    }

    return res.status(200).json({
      status: "success",
      message: `Queued ${attachmentIds.length} file(s) for BM25 indexing`,
      queuedCount: attachmentIds.length
    });
  }
}

export { BM25Controller };
