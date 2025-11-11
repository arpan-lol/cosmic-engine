import { Response } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import {
  SendMessageRequest,
  SendMessageResponse,
} from '../../types/chat.types';
import { GenerationService } from '../../services/llm/generation.service';

export class MessageController {
  /**
   * Send message (creates user message and triggers LLM response)
   */
  static async sendMessage(req: AuthRequest, res: Response): Promise<Response> {
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

      return res.status(201).json(response);

      // TODO: Trigger LLM response generation in background
    } catch (error) {
      console.error('[chat] Error sending message:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  }

  /**
   * SSE endpoint for streaming 
   */
  static async streamResponse(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id: sessionId } = req.params;

    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20,
          },
        },
      });

      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

      const lastMessage = session.messages[session.messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'No user message found' })}\n\n`);
        res.end();
        return;
      }

      const conversationHistory = session.messages.slice(0, -1).map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      let fullResponse = '';

      try {
        const stream = GenerationService.streamResponse(
          sessionId,
          lastMessage.content,
          conversationHistory,
          true
        );

        for await (const chunk of stream) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
        }

        const assistantMessage = await prisma.message.create({
          data: {
            sessionId,
            role: 'assistant',
            content: fullResponse,
            tokens: fullResponse.length,
          },
        });

        res.write(
          `data: ${JSON.stringify({ type: 'done', messageId: assistantMessage.id })}\n\n`
        );
      } catch (streamError) {
        console.error('[chat] Error in LLM streaming:', streamError);
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`);
      }

      res.end();
    } catch (error) {
      console.error('[chat] Error in stream:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`);
      res.end();
    }
  }
}
