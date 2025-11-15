import { Response } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import { UploadFileResponse } from '../../types/chat.types';
import path from 'path';
import { jobQueue } from '../../queue';
import { sseService } from '../../services/sse.service';

export class AttachmentController {
  static async uploadFile(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { sessionId } = req.body; // Get sessionId from request body

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const file = req.file;

    try {
      // Verify session belongs to user
      const session = await prisma.session.findUnique({
        where: { id: sessionId, userId },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
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

      // Queue the file for processing with sessionId
      jobQueue.add('process-file', {
        attachmentId: attachment.id,
        userId,
        sessionId, // Pass sessionId to orchestrator
      }).catch((err: Error) => {
        console.error(`[chat] Failed to queue file processing: ${err.message}`);
      });

      const response: UploadFileResponse = {
        attachmentId: attachment.id,
        filename: attachment.filename,
        type: attachment.type,
        url: attachment.url,
      };

      console.log(`[chat] File uploaded: ${attachment.filename} (${attachment.id}) for session ${sessionId}`);
      return res.status(201).json(response);
    } catch (error) {
      console.error('[chat] Error uploading file:', error);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  /**
   * Get attachment processing status
   */
  static async getAttachmentStatus(req: AuthRequest, res: Response) {
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

  static async streamAttachmentStatus(req: AuthRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { attachmentId } = req.params;

    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      sseService.addClient(attachmentId, res);

      console.log(`[chat] SSE stream started for attachment: ${attachmentId}`);
    } catch (error) {
      console.error('[chat] Error starting SSE stream:', error);
      return res.status(500).json({ error: 'Failed to start stream' });
    }
  }
}
