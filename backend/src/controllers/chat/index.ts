import { SessionController } from './session.controller';
import { MessageController } from './message.controller';
import { AttachmentController } from './attachment.controller';
import { SearchController } from './search.controller';

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

  // Search methods
  searchSession: SearchController.searchSession,
};

export { SessionController } from './session.controller';
export { MessageController } from './message.controller';
export { AttachmentController } from './attachment.controller';
export { SearchController } from './search.controller';
