import { Content } from '@google/genai';
import type { ModelMessage } from 'ai';
import { RetrievalService } from './retrieval.service';
import { buildPrompt } from './prompts/system.prompt';
import { estimatePromptTokens } from '../../utils/token-estimator.util';
import { logger } from '../../utils/logger.util';
import { AppError, isGeminiError, parseGeminiError, ProcessingError, ValidationError } from '../../types/errors';
import { RetrievalOptions } from '../../types/chat.types';
import { sseService } from '../sse.service';
import { PerformanceTracker } from '../../utils/timer.util';
import { getGeminiClient } from './gemini-key-ring';
import { LLMAdapter } from './llm-adapter.service';
import { LLMResolver, LLMRuntime } from './llm-resolver.service';

const MODEL = 'gemini-2.5-flash';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function isQuotaLikeError(error: any): boolean {
  const message = String(error?.message ?? error ?? '').toLowerCase();

  return (
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('resource_exhausted') ||
    message.includes('too many requests') ||
    message.includes('429') ||
    message.includes('overloaded') ||
    message.includes('503')
  );
}

export class GenerationService {
  static async *streamResponse(
    userId: number,
    sessionId: string,
    query: string,
    conversationHistory: ChatMessage[] = [],
    attachmentIds?: string[],
    options?: RetrievalOptions,
    timer?: PerformanceTracker
  ): AsyncGenerator<string> {
    let runtime: LLMRuntime | null = null;

    try {
      timer?.startTimer('retrieval');
      const enhancedContexts = await RetrievalService.getContext(sessionId, query, attachmentIds, options, timer);
      timer?.endTimer('retrieval');
      
      if (!options?.bm25) {
        await sseService.publishToSession(sessionId, {
          type: 'notification',
          scope: 'session',
          message: 'retrieval-complete',
          data: {
            title: 'Retrieved context',
            body: enhancedContexts.map(ctx =>
              `${ctx.filename} - chunk ${ctx.chunkIndex}`
            )
          },
          timestamp: new Date().toISOString()
        });
      }

      timer?.startTimer('promptBuilding');
      const prompt = buildPrompt(query, enhancedContexts, conversationHistory);
      const contextStrings = enhancedContexts.map((ctx) => ctx.content);
      const estimatedTokens = estimatePromptTokens(
        prompt.substring(0, 1000),
        contextStrings,
        conversationHistory,
        query
      );
      timer?.endTimer('promptBuilding');
      logger.info('Generation', 'Stream prompt token estimate', { estimatedTokens, sessionId });

      runtime = await LLMResolver.resolve(userId);
      const messages: ModelMessage[] = [{ role: 'user', content: prompt }];

      await sseService.publishToSession(sessionId, {
        type: 'notification',
        scope: 'session',
        message: 'generation-started',
        data: {
          title: 'Started generating response',
          body: [
            `Model: ${runtime.modelName}`,
            `Source: ${runtime.keyLabel}`,
            `Query: ${query}`,
          ]
        },
        timestamp: new Date().toISOString()
      });

      timer?.startTimer('totalGeneration');
      timer?.startTimer('firstToken');
      let firstTokenReceived = false;
      let accumulatedText = '';

      for await (const chunk of LLMAdapter.stream({
        provider: runtime.provider,
        modelId: runtime.modelId,
        apiKey: runtime.apiKey,
        messages,
        onToolResult: async (event) => {
          await sseService.publishToSession(sessionId, {
            type: 'notification',
            scope: 'session',
            message: 'tool-response',
            data: {
              title: `Tool executed: ${event.toolName}`,
              body: [
                `Input: ${JSON.stringify(event.input ?? {})}`,
                `Response length: ${String(event.output ?? '').length}`,
              ]
            },
            timestamp: new Date().toISOString()
          });
        },
      })) {
        if (!firstTokenReceived) {
          timer?.endTimer('firstToken');
          firstTokenReceived = true;
        }
        accumulatedText += chunk;
        yield chunk;
      }

      await sseService.publishToSession(sessionId, {
        type: 'notification',
        scope: 'session',
        message: 'generation-complete',
        data: {
          title: 'Response complete',
          body: [`Length: ${accumulatedText.length} chars`]
        },
        timestamp: new Date().toISOString()
      });

      timer?.endTimer('totalGeneration');
    } catch (error) {
      logger.error('Generation', 'Error streaming response', error instanceof Error ? error : undefined, { sessionId });

      if (runtime?.keySource === 'platform' && isQuotaLikeError(error)) {
        throw new ValidationError(
          runtime.isGuest
            ? 'Cosmic Engine free Gemini access is busy. Log in to add your own model API key and keep going.'
            : 'Cosmic Engine free Gemini access is busy. Add your own model API key to keep going.'
        );
      }

      if (error instanceof AppError) {
        throw error;
      }

      if (isGeminiError(error)) {
        throw parseGeminiError(error);
      }

      throw new ProcessingError('Failed to stream response');
    }
  }

  static async generate(params: {
    systemPrompt?: string
    userPrompt: string
    temperature?: number
    maxTokens?: number
  }): Promise<string> {
    const {
      systemPrompt,
      userPrompt,
      temperature = 0.5,
      maxTokens = 500,
    } = params

    try {
      const contents: Content[] = []

      if (systemPrompt) {
        contents.push({
          role: 'user' as const,
          parts: [{ text: systemPrompt }],
        })
      }

      contents.push({
        role: 'user' as const,
        parts: [{ text: userPrompt }],
      })

      const result = await getGeminiClient().models.generateContent({
        model: MODEL,
        contents,
        config: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      })

      const text =
        result.candidates?.[0]?.content?.parts
          ?.map(p => p.text)
          .filter(Boolean)
          .join('') ?? ''

      return text.trim()
    } catch (error) {
      logger.error(
        'Generation',
        'generate() failed',
        error instanceof Error ? error : undefined
      )
      throw error
    }
  }
}
