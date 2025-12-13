import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import {
  SendMessageRequest,
  SendMessageResponse,
} from '../../types/chat.types';
import { GenerationService } from '../../services/llm/generation.service';
import { logger } from '../../utils/logger.util';
import { sseService } from '../../services/sse.service';
import { UnauthorizedError, NotFoundError, ValidationError, ProcessingError } from '../../types/errors';
import { buildQueryCacheKey, QueryCacheService } from 'src/services/features/caching/cache.service';

export class MessageController {
  static async message(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError();
    }

    console.log(`REQUEST BODY: ${req.body}`)

    const { id: sessionId } = req.params;
    const { content, attachmentIds, options }: SendMessageRequest = req.body;

    console.log('[CACHE] cachingEnabled:', options?.caching, options)

    if (!content?.trim()) {
      throw new ValidationError('Message content is required');
    }

    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId, userId },
        include: {
          chats: {
            where: { role: { not: 'system' } },
            orderBy: { createdAt: 'asc' },
            take: 20,
          },
        },
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      const userMessage = await prisma.chat.create({
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
      await prisma.session.update({
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

      const conversationHistory = session.chats.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      let fullResponse = '';

      const cachingEnabled = options?.caching === true

      let cacheKey: string | null = null

      if (cachingEnabled) {
        cacheKey = buildQueryCacheKey({
          sessionId,
          query: content.trim(),
          attachmentIds: attachmentIds ?? [],
          options,
        })

        const cachedAssistant = await QueryCacheService.getCachedResponse(cacheKey)

        if (cachedAssistant) {
          await sseService.publishToSession(sessionId, {
            type: 'success',
            scope: 'session',
            message: 'query-cache-hit',
            showInChat: false,
            data: {
              title: 'Cached response',
              body: ['Reusing a previously generated answer'],
            },
            timestamp: new Date().toISOString(),
          })

          const text = cachedAssistant.content || ''

          for (const chunk of text.match(/.{1,30}/g) || []) {
            res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`)
          }

          const replayed = await prisma.chat.create({
            data: {
              sessionId,
              role: 'assistant',
              content: text,
              tokens: cachedAssistant.tokens,
            },
          })

          res.write(
            `data: ${JSON.stringify({ type: 'done', messageId: replayed.id })}\n\n`
          )

          res.end()
          return
        }

        await QueryCacheService.recordRequest({
          cacheKey,
          sessionId,
          query: content.trim(),
          attachmentIds: attachmentIds ?? [],
          options,
        })
      }

      try {
        const stream = GenerationService.streamResponse(
          sessionId,
          content.trim(),
          conversationHistory,
          attachmentIds,
          options
        );

        for await (const chunk of stream) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
        }

        // Save assistant response
        const assistantMessage = await prisma.chat.create({
          data: {
            sessionId,
            role: 'assistant',
            content: fullResponse,
            tokens: fullResponse.length,
          },
        });

        if (cachingEnabled && cacheKey) {
          await QueryCacheService.attachAssistantMessage(cacheKey, assistantMessage.id)
        }

        res.write(
          `data: ${JSON.stringify({ type: 'done', messageId: assistantMessage.id })}\n\n`
        );
      } catch (streamError: any) {
        logger.error('MessageController', 'Error in LLM streaming', streamError instanceof Error ? streamError : undefined, { sessionId, userId });
        
        let errorMessage = 'Processing failed! The server might be overloaded, please try again later.';
        
        console.log('[MESSAGE] Stream error caught:', {
          shouldExposeToClient: streamError?.shouldExposeToClient,
          clientMessage: streamError?.clientMessage,
          message: streamError?.message,
          name: streamError?.name
        });
        
        if (streamError?.shouldExposeToClient && streamError?.clientMessage) {
          errorMessage = streamError.clientMessage;
        } else if (streamError?.shouldExposeToClient && streamError instanceof Error && streamError.message) {
          errorMessage = streamError.message;
        } else if (streamError instanceof Error && streamError.message) {
          errorMessage = streamError.message;
        }
        
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`
        );
        sseService.publishToSession(sessionId, {
          type: 'error',
          scope: 'session',
          message: errorMessage,
          showInChat: false,
          timestamp: new Date().toISOString(),
        }).catch((err: any) => {
          logger.error('MessageController', 'Failed to publish error event', err);
        });
      }

      res.end();
    } catch (error: any) {
      logger.error('MessageController', 'Error in message endpoint', error instanceof Error ? error : undefined, { sessionId, userId });
      
      if (!res.headersSent) {
        next(error);
      } else {
        let errorMessage = 'Processing failed! The server might be overloaded, please try again later.';
        
        if (error?.shouldExposeToClient && error?.clientMessage) {
          errorMessage = error.clientMessage;
        } else if (error instanceof Error && error.message) {
          errorMessage = error.message;
        }
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`
        );
        sseService.publishToSession(sessionId, {
          type: 'error',
          scope: 'session',
          message: errorMessage,
          showInChat: false,
          timestamp: new Date().toISOString(),
        }).catch((err: any) => {
          logger.error('MessageController', 'Failed to publish error event', err);
        });
        res.end();
      }
    }
  }
}
