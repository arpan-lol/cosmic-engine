import { SessionController } from './session.controller';
import { MessageController } from './message.controller';
import { AttachmentController } from './attachment.controller';
import { ChunksController } from './serve-chunks.controller';

export const ChatController = {
  // Session methods
  createSession: SessionController.createSession,
  getSessions: SessionController.getSessions,
  getSessionById: SessionController.getSessionById,
  deleteSession: SessionController.deleteSession,

  // Message methods
  message: MessageController.message,

  // Attachment methods
  uploadFile: AttachmentController.uploadFile,
  getSessionAttachments: AttachmentController.getSessionAttachments,
  getAttachmentStatus: AttachmentController.getAttachmentStatus,
  streamAttachmentStatus: AttachmentController.streamAttachmentStatus,
  deleteAttachment: AttachmentController.deleteAttachment,

  // Chunks methods
  getChunks: ChunksController.getChunks,
};

export { SessionController } from './session.controller';
export { MessageController } from './message.controller';
export { AttachmentController } from './attachment.controller';
export { ChunksController } from './serve-chunks.controller';
