export interface User {
  userId: number;
  email: string;
  name: string;
  picture?: string;
}

export interface Conversation {
  id: string;
  userId: number;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  attachments?: Attachment[];
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens?: number;
  createdAt: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  messageId?: string;
  type: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AttachmentStatus {
  attachmentId: string;
  filename: string;
  processed: boolean;
  error?: string;
  chunkCount?: number;
  processedAt?: string;
  failedAt?: string;
}

export interface SearchResult {
  content: string;
  score: number;
  metadata: {
    attachmentId: string;
    chunkIndex: number;
    pageNumber?: number;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  stats: {
    totalVectors: number;
    resultsReturned: number;
    query: string;
  };
  message?: string;
}

export interface SSEMessage {
  type: 'user_message' | 'token' | 'done' | 'error';
  messageId?: string;
  content?: string;
  error?: string;
}
