import { Response } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import {
  SendMessageRequest,
  SendMessageResponse,
} from '../../types/chat.types';
import { GenerationService } from '../../services/llm/generation.service';

export class MessageController {
  static async message(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id: sessionId } = req.params;
    const { content, attachmentIds, documentIds }: SendMessageRequest = req.body;

    if (!content?.trim()) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

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

      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      res.write(
        `data: ${JSON.stringify({
          type: 'user_message',
          messageId: userMessage.id,
          content: userMessage.content,
        })}\n\n`
      );

      const conversationHistory = session.messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      let fullResponse = '';

      try {
        // Stream LLM response with optional document filtering
        const stream = GenerationService.streamResponse(
          sessionId,
          content.trim(),
          conversationHistory,
          true, // useRAG
          documentIds // filter by these document IDs if provided
        );

        for await (const chunk of stream) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
        }

        // Save assistant response
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
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: 'Failed to generate response' })}\n\n`
        );
      }

      res.end();
    } catch (error) {
      console.error('[chat] Error in message endpoint:', error);
      
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to process message' });
      } else {
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`
        );
        res.end();
      }
    }
  }
}
