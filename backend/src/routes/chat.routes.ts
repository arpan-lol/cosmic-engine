import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { ChatController } from '../controllers/chat';
import { upload } from '../config/upload';

const router = Router();

router.use(authenticateJWT);

// Session management
router.post('/sessions', ChatController.createSession);
router.get('/sessions', ChatController.getSessions);
router.get('/sessions/:id', ChatController.getSessionById);
router.delete('/sessions/:id', ChatController.deleteSession);

// Messaging (unified endpoint - creates message and streams response)
router.post('/sessions/:id/message', ChatController.message);

// File uploads and processing
router.post('/upload', upload.single('file'), ChatController.uploadFile);
router.get('/sessions/:sessionId/attachments', ChatController.getSessionAttachments);
router.get('/attachments/:attachmentId/status', ChatController.getAttachmentStatus);
router.get('/attachments/:attachmentId/stream', ChatController.streamAttachmentStatus);

// Semantic search
router.post('/sessions/:id/search', ChatController.searchSession);

export default router;