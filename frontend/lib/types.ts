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
  timeMetrics?: {
    id: string;
    chatId: string;
    totalRequestMs: number;
    queryExpansionMs?: number;
    retrievalMs?: number;
    embeddingMs?: number;
    vectorSearchMs?: number;
    bm25SearchMs?: number;
    rankingMs?: number;
    hydrationMs?: number;
    perAttachmentMs?: Record<string, {
      embeddingMs?: number;
      vectorSearchMs?: number;
      bm25SearchMs?: number;
      totalMs?: number;
    }>;
    promptBuildingMs?: number;
    firstTokenMs?: number;
    streamingMs?: number;
    total?: number;
    createdAt: string;
    isCached?: boolean;
    cachedQuery?: string;
    cachedAttachmentNames?: string[];
    cachedOptions?: any;
  };
}

export interface EngineEvent {
  type: 'notification' | 'success' | 'error' | 'title-update';
  scope: 'session' | 'user';
  sessionId?: string;
  message: string;
  attachmentId?: string;
  actionType?: 'view-chunks';
  data?: {
    title: string;
    body: string[];
  };
  newTitle?: string;
  timestamp: string;
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

export interface StreamStatus {
  status: 'connected' | 'processing' | 'completed' | 'error';
  step?: string;
  message?: string;
  progress?: number;
  phase?: string;
  chunkCount?: number;
  embeddingCount?: number;
  error?: string;
}
