import { Router, Request, Response, NextFunction } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { ChatController } from '../controllers/chat';
import { upload } from '../config/upload';
import { asyncHandler } from '../utils/asyncHandler.util';

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
router.delete('/sessions/:id', asyncHandler(ChatController.deleteSession));

router.post('/sessions/:id/message', asyncHandler(ChatController.message));

router.post('/upload', corsMiddleware, upload.single('file'), asyncHandler(ChatController.uploadFile));
router.get('/sessions/:sessionId/attachments', asyncHandler(ChatController.getSessionAttachments));
router.get('/attachments/:attachmentId/status', asyncHandler(ChatController.getAttachmentStatus));
router.get('/attachments/:attachmentId/stream', corsMiddleware, asyncHandler(ChatController.streamAttachmentStatus));
router.delete('/attachments/:attachmentId', asyncHandler(ChatController.deleteAttachment));

router.post('/sessions/:id/search', asyncHandler(ChatController.searchSession));

export default router;