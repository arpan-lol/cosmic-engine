import { Router, Request, Response, NextFunction } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { ChatController } from '../controllers/chat';
import { upload } from '../config/upload';

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

// Session management
router.post('/sessions', ChatController.createSession);
router.get('/sessions', ChatController.getSessions);
router.get('/sessions/:id', ChatController.getSessionById);
router.delete('/sessions/:id', ChatController.deleteSession);

// Messaging (unified endpoint - creates message and streams response)
router.post('/sessions/:id/message', ChatController.message);

// File uploads and processing
router.post('/upload', corsMiddleware, upload.single('file'), ChatController.uploadFile);
router.get('/sessions/:sessionId/attachments', ChatController.getSessionAttachments);
router.get('/attachments/:attachmentId/status', ChatController.getAttachmentStatus);
router.get('/attachments/:attachmentId/stream', corsMiddleware, ChatController.streamAttachmentStatus);

// Semantic search
router.post('/sessions/:id/search', ChatController.searchSession);

export default router;