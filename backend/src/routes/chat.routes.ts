import { Router, Request, Response, NextFunction } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { ChatController } from '../controllers/chat';
import { EventsController } from '../controllers/events.controller';
import { upload } from '../config/upload';
import { asyncHandler } from '../utils/asyncHandler.util';
import { BM25Controller } from 'src/controllers/bm25.controller';

const router = Router();

const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = process.env.FRONTEND_ORIGIN || 'https://cosmicengine.arpantaneja.dev';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

router.use(authenticateJWT);

router.post('/sessions', asyncHandler(ChatController.createSession));
router.get('/sessions', asyncHandler(ChatController.getSessions));
router.get('/sessions/:id', asyncHandler(ChatController.getSessionById));
router.patch('/sessions/:id', asyncHandler(ChatController.updateSession));
router.delete('/sessions/:id', asyncHandler(ChatController.deleteSession));

router.get('/sessions/:id/events', corsMiddleware, asyncHandler(EventsController.streamSessionEvents));

router.post('/sessions/:id/message', asyncHandler(ChatController.message));
router.post('/indexbm25/:id', asyncHandler(BM25Controller.indexFiles))
router.post('/upload', corsMiddleware, upload.single('file'), asyncHandler(ChatController.uploadFile));
router.get('/sessions/:sessionId/attachments', asyncHandler(ChatController.getSessionAttachments));
router.get('/attachments/:attachmentId/status', asyncHandler(ChatController.getAttachmentStatus));
router.get('/attachments/:attachmentId/stream', corsMiddleware, asyncHandler(ChatController.streamAttachmentStatus));
router.get('/attachments/:attachmentId/file', asyncHandler(ChatController.serveFile));
router.delete('/attachments/:attachmentId', asyncHandler(ChatController.deleteAttachment));

router.post('/sessions/:id/chunks', asyncHandler(ChatController.getChunks));

export default router;