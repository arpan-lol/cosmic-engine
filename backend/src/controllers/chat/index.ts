import { SessionController } from './session.controller';
import { MessageController } from './message.controller';
import { AttachmentController } from './attachment.controller';
import { ChunksController } from './serve-chunks.controller';
import { CacheController } from './cache.controller';

export const ChatController = {
  // Session methods
  createSession: SessionController.createSession,
  getSessions: SessionController.getSessions,
  getSessionById: SessionController.getSessionById,
  updateSession: SessionController.updateSession,
  deleteSession: SessionController.deleteSession,

  // Message methods
  message: MessageController.message,

  // Attachment methods
  uploadFile: AttachmentController.uploadFile,
  getSessionAttachments: AttachmentController.getSessionAttachments,
  getAttachmentStatus: AttachmentController.getAttachmentStatus,
  streamAttachmentStatus: AttachmentController.streamAttachmentStatus,
  serveFile: AttachmentController.serveFile,
  deleteAttachment: AttachmentController.deleteAttachment,

  // Chunks methods
  getChunks: ChunksController.getChunks,

  // Cache methods
  getCache: CacheController.getCache,
};

export { SessionController } from './session.controller';
export { MessageController } from './message.controller';
export { AttachmentController } from './attachment.controller';
export { ChunksController } from './serve-chunks.controller';
export { CacheController } from './cache.controller';
