import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { ChatController } from '../controllers/chat.controllers';
import { upload } from '../config/upload';

const router = Router();

router.use(authenticateJWT);

router.post('/sessions', ChatController.createSession);
router.get('/sessions', ChatController.getSessions);
router.get('/sessions/:id', ChatController.getSessionById);
router.delete('/sessions/:id', ChatController.deleteSession);
router.post('/sessions/:id/messages', ChatController.sendMessage);
router.get('/sessions/:id/stream', ChatController.streamResponse);
router.post('/upload', upload.single('file'), ChatController.uploadFile);
router.get('/attachments/:attachmentId/status', ChatController.getAttachmentStatus);
router.get('/attachments/:attachmentId/stream', ChatController.streamAttachmentStatus);

export default router;