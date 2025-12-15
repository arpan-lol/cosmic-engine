export type TitleSource = 'USER_PROVIDED' | 'USER_EDITED' | 'AI_GENERATED' | 'DEFAULT';

export interface RetrievalOptions {
  bm25?: boolean;
  rrf?: boolean;
  caching?: boolean;
  queryExpansion?: {
    enabled: boolean
    temperature: number
  }
}

export interface CreateSessionRequest {
  title?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  title?: string;
  titleSource: TitleSource;
  createdAt: Date;
}

export interface SendMessageRequest {
  content: string;
  attachmentIds?: string[];
  options?: RetrievalOptions;
}

export interface SendMessageResponse {
  messageId: string;
  content: string;
  role: 'user';
  createdAt: Date;
}

export interface MessageChunk {
  type: 'token' | 'done' | 'error';
  content?: string;
  messageId?: string;
  error?: string;
}

export interface UploadFileResponse {
  attachmentId: string;
  filename: string;
  type: string;
  url: string;
}

export interface UpdateSessionRequest {
  title: string;
}

export interface UpdateSessionResponse {
  id: string;
  title: string;
  titleSource: TitleSource;
  updatedAt: Date;
}

export interface SessionDetails {
  id: string;
  title?: string;
  titleSource: TitleSource;
  createdAt: Date;
  updatedAt: Date;
  messages: MessageDetails[];
}

export interface MessageDetails {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments: AttachmentDetails[];
  tokens?: number;
  createdAt: Date;
}

export interface AttachmentDetails {
  id: string;
  type: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  metadata?: any;
}
