import { Router, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { AuthRequest } from '../types/express';
import prisma from '../prisma/client';
import {
  CreateSessionRequest,
  CreateSessionResponse,
  SendMessageRequest,
  SendMessageResponse,
  SessionDetails,
} from '../types/chat.types';

const router = Router();

router.use(authenticateJWT);

router.post('/sessions', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { title }: CreateSessionRequest = req.body;
  

  try {
    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: title || 'New Chat',
      },
    });

    const response: CreateSessionResponse = {
      sessionId: session.id,
      title: session.title || undefined,
      createdAt: session.createdAt,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('[chat] Error creating session:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
});

router.get('/sessions', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.status(200).json({ sessions });
  } catch (error) {
    console.error('[chat] Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/sessions/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            attachments: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const response: SessionDetails = {
      id: session.id,
      title: session.title || undefined,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messages: session.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        tokens: msg.tokens || undefined,
        createdAt: msg.createdAt,
        attachments: msg.attachments.map((att) => ({
          id: att.id,
          type: att.type,
          url: att.url,
          filename: att.filename,
          mimeType: att.mimeType,
          size: att.size,
          metadata: att.metadata || undefined,
        })),
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('[chat] Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

router.delete('/sessions/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id, userId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await prisma.chatSession.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('[chat] Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// ⭐️
router.post('/sessions/:id/messages', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id: sessionId } = req.params;
  const { content, attachmentIds }: SendMessageRequest = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // verify session belongs to user
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const userMessage = await prisma.message.create({
      data: {
        sessionId,
        role: 'user',
        content: content.trim(),
        attachments: attachmentIds
          ? {
              connect: attachmentIds.map((id) => ({ id })),
            }
          : undefined,
      },
    });

    // update session timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    const response: SendMessageResponse = {
      messageId: userMessage.id,
      content: userMessage.content,
      role: 'user',
      createdAt: userMessage.createdAt,
    };

    res.status(201).json(response);

    // TODO: Trigger LLM response generation in background
  } catch (error) {
    console.error('[chat] Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// SSE endpoint for streaming LLM responses
router.get('/sessions/:id/stream', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id: sessionId } = req.params;

  try {
    // verify session belongs to user
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId, userId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // TODO
    const mockResponse = 'This is a mock LLM response. Actual LLM integration coming soon.';
    
    const assistantMessage = await prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        content: mockResponse,
      },
    });

    for (const char of mockResponse) {
      res.write(`data: ${JSON.stringify({ type: 'token', content: char })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate streaming delay
    }

    res.write(
      `data: ${JSON.stringify({ type: 'done', messageId: assistantMessage.id })}\n\n`
    );

    res.end();
  } catch (error) {
    console.error('[chat] Error in stream:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`);
    res.end();
  }
});

router.post('/upload', async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  // TODO: implement file upload
  res.status(501).json({ error: 'File upload not yet implemented' });
});

export default router;
