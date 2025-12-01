import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import { UploadFileResponse } from '../../types/chat.types';
import path from 'path';
import { jobQueue } from '../../queue';
import { sseService } from '../../services/sse.service';
import { logger } from '../../utils/logger.util';
import { UnauthorizedError, NotFoundError, ValidationError, ProcessingError } from '../../types/errors';

export class AttachmentController {
  static async uploadFile(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    const file = req.file;

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      // Determine file type based on mimetype
      let fileType = 'document';
      if (file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (file.mimetype === 'application/pdf') {
        fileType = 'pdf';
      } else if (
        file.mimetype.includes('word') ||
        file.mimetype.includes('document')
      ) {
        fileType = 'document';
      } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
        fileType = 'spreadsheet';
      } else if (file.mimetype.includes('presentation') || file.mimetype.includes('powerpoint')) {
        fileType = 'presentation';
      }

      const attachment = await prisma.attachment.create({
        data: {
          type: fileType,
          url: path.join('uploads', file.filename),
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            storedFilename: file.filename,
            processed: false,
            sessionId, // Store session reference
          },
        },
      });

      sseService.sendToAttachment(attachment.id, {
        status: 'processing',
        step: 'queued',
        message: `Upload complete, queuing ${file.originalname}...`,
        progress: 0,
      });

      jobQueue.add('process-file', {
        attachmentId: attachment.id,
        userId,
        sessionId,
      }).catch((err: Error) => {
        logger.error('AttachmentController', 'Failed to queue file processing', err, { attachmentId: attachment.id, sessionId });
      });

      const response: UploadFileResponse = {
        attachmentId: attachment.id,
        filename: attachment.filename,
        type: attachment.type,
        url: attachment.url,
      };

      logger.info('AttachmentController', `File uploaded: ${attachment.filename}`, { attachmentId: attachment.id, sessionId });
      return res.status(201).json(response);
    } catch (error) {
      logger.error('AttachmentController', 'Error uploading file', error instanceof Error ? error : undefined, { sessionId, userId });
      if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
      next(new ProcessingError('Failed to upload file'));
    }
  }

  static async getSessionAttachments(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const { sessionId } = req.params;

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId, userId },
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      // Get all attachments for this session
      const attachments = await prisma.attachment.findMany({
        where: {
          metadata: {
            path: ['sessionId'],
            equals: sessionId,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Format response with processing status
      const attachmentsWithStatus = attachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        type: att.type,
        url: att.url,
        storedFilename: (att.metadata as any)?.storedFilename,
        mimeType: att.mimeType,
        size: att.size,
        createdAt: att.createdAt,
        metadata: {
          processed: (att.metadata as any)?.processed || false,
          error: (att.metadata as any)?.error,
          chunkCount: (att.metadata as any)?.chunkCount,
        },
      }));

      return res.status(200).json({ attachments: attachmentsWithStatus });
    } catch (error) {
      logger.error('AttachmentController', 'Error fetching session attachments', error instanceof Error ? error : undefined, { sessionId, userId });
      if (error instanceof NotFoundError) throw error;
      next(new ProcessingError('Failed to fetch attachments'));
    }
  }

  static async getAttachmentStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { attachmentId } = req.params;

      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      const metadata = attachment.metadata as any;
      const processed = metadata?.processed || false;
      const error = metadata?.error;
      const chunkCount = metadata?.chunkCount;

      return res.status(200).json({
        attachmentId: attachment.id,
        filename: attachment.filename,
        processed,
        error,
        chunkCount,
        processedAt: metadata?.processedAt,
        failedAt: metadata?.failedAt,
      });
    } catch (error) {
      console.error('[chat] Error getting attachment status:', error);
      return res.status(500).json({ error: 'Failed to get attachment status' });
    }
  }

  static async streamAttachmentStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    const { attachmentId } = req.params;

    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        throw new NotFoundError('Attachment not found');
      }

      sseService.addClient(attachmentId, res);

      logger.info('AttachmentController', `SSE stream started for attachment: ${attachmentId}`);
    } catch (error) {
      logger.error('AttachmentController', 'Error starting SSE stream', error instanceof Error ? error : undefined, { attachmentId, userId });
      if (error instanceof NotFoundError) throw error;
      next(new ProcessingError('Failed to start stream'));
    }
  }
}
