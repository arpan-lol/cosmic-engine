import { GoogleGenAI, Type, Content, Part } from '@google/genai';
import { RetrievalService } from './retrieval.service';
import { buildPrompt } from './prompts/system.prompt';
import { estimatePromptTokens } from '../../utils/token-estimator.util';
import { logger } from '../../utils/logger.util';
import { isGeminiError, parseGeminiError, ProcessingError } from '../../types/errors';
import { RetrievalOptions } from '../../types/chat.types';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const MODEL = 'gemini-2.5-flash';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ToolAwareResult {
  finalText: string;
  contents: Content[];
}

async function callEndpoint(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const responseText = await res.text();
      logger.info('Generation-Tool', `Fetched endpoint: ${url}`, { length: responseText.length });
      return responseText;
    } else {
      return `endpoint fetch failed with status: ${res.status} ${res.statusText}`;
    }
  } catch (err) {
    logger.error('Generation-Tool', 'Error fetching endpoint', err instanceof Error ? err : undefined, { url });
    return `endpoint fetch failed with error: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

const toolFunctions: { [key: string]: (url: string) => Promise<string> } = {
  Call_an_endpoint: callEndpoint,
};

const callEndpointDeclaration = {
  functionDeclarations: [
    {
      name: 'Call_an_endpoint',
      description:
        'Sends and receives response from an HTTP Request to an API Endpoint on the internet',
      parameters: {
        type: Type.OBJECT,
        properties: {
          url: {
            type: Type.STRING,
            description: 'The URL endpoint to visit',
          },
        },
        required: ['url'],
      },
    },
  ],
};

function formatHistory(
  conversationHistory: ChatMessage[]
): Content[] {
  return conversationHistory.map((msg) => ({
    role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: msg.content }],
  }));
}

async function* streamWithToolSupport(
  contents: Content[],
  sessionId: string
): AsyncGenerator<{ type: 'token' | 'functionCall'; data: any }> {
  const stream = await ai.models.generateContentStream({
    model: MODEL,
    contents,
    config: {
      tools: [callEndpointDeclaration],
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  });

  let detectedFunctionCall: any | undefined;
  let modelPartsForFunctionCall: Part[] | undefined;

  for await (const chunk of stream) {
    const candidates = chunk.candidates ?? [];

    for (const candidate of candidates) {
      const parts: Part[] = candidate.content?.parts ?? [];

      for (const part of parts) {
        if (part.text) {
          yield { type: 'token', data: part.text };
        }

        if (part.functionCall) {
          detectedFunctionCall = part.functionCall;
          modelPartsForFunctionCall = parts;
          yield {
            type: 'functionCall',
            data: { functionCall: detectedFunctionCall, modelParts: modelPartsForFunctionCall },
          };
          return;
        }
      }
    }
  }
}


export class GenerationService {
  static async *streamResponse(
    sessionId: string,
    query: string,
    conversationHistory: ChatMessage[] = [],
    attachmentIds?: string[],
    options?: RetrievalOptions
  ): AsyncGenerator<string> {
    try {
      const enhancedContexts = await RetrievalService.getContext(sessionId, query, attachmentIds, options);
      const systemPromptWithContext = buildPrompt('', enhancedContexts, []);
      const contextStrings = enhancedContexts.map((ctx) => ctx.content);
      const estimatedTokens = estimatePromptTokens(
        systemPromptWithContext.substring(0, 1000),
        contextStrings,
        conversationHistory,
        query
      );
      logger.info('Generation', 'Stream prompt token estimate', { estimatedTokens, sessionId });

      // initial contents: system (as user instruction), history, and the user query
      let contents: Content[] = [
        {
          role: 'user' as const,
          parts: [{ text: systemPromptWithContext }],
        },
        ...formatHistory(conversationHistory),
        {
          role: 'user' as const,
          parts: [{ text: query }],
        },
      ];

      const maxIterations = 10;
      let iterationCount = 0;

      while (iterationCount < maxIterations) {
        iterationCount++;
        logger.debug('Generation', `Streaming iteration ${iterationCount}`, { sessionId });

        let accumulatedText = '';
        let functionCallDetected = false;
        let functionCallData: any = null;

        for await (const item of streamWithToolSupport(contents, sessionId)) {
          if (item.type === 'token') {
            accumulatedText += item.data;
            yield item.data;
          } else if (item.type === 'functionCall') {
            functionCallDetected = true;
            functionCallData = item.data;
            break;
          }
        }

        if (functionCallDetected && functionCallData) {
          const { functionCall, modelParts } = functionCallData;
          const { name, args } = functionCall;

          logger.info('Generation', `Function call detected during stream: ${name}`, { sessionId });

          if (!name || !toolFunctions[name]) {
            logger.error('Generation', `Unknown function call: ${name}`, undefined, { sessionId, functionCall });
            throw new ProcessingError(`Unknown function call: ${name}`);
          }

          if (!args || !args.url || typeof args.url !== 'string') {
            logger.error('Generation', `Missing or invalid 'url' arg for function: ${name}`, undefined, { sessionId, args });
            throw new ProcessingError(`Missing or invalid 'url' arg for function: ${name}`);
          }

          contents.push({
            role: 'model' as const,
            parts: modelParts ?? [{ functionCall }],
          });

          logger.info('Generation', `Executing tool: ${name}`, { url: args.url, sessionId });
          const toolResponse = await toolFunctions[name](args.url as string);

          contents.push({
            role: 'user' as const,
            parts: [
              {
                functionResponse: {
                  name,
                  response: {
                    result: toolResponse,
                  },
                },
              } as any,
            ],
          });

          continue;
        }

        contents.push({
          role: 'model' as const,
          parts: [{ text: accumulatedText }],
        });

        return;
      }

      logger.warn('Generation', `Reached maximum streaming iterations (${maxIterations})`, { sessionId });
      yield 'Maximum processing iterations reached. Please try rephrasing your question.';
    } catch (error) {
      logger.error('Generation', 'Error streaming response', error instanceof Error ? error : undefined, { sessionId });

      if (isGeminiError(error)) {
        throw parseGeminiError(error);
      }

      throw new ProcessingError('Failed to stream response');
    }
  }
}
