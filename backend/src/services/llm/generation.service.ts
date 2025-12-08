import { GoogleGenAI, Type } from '@google/genai';
import { RetrievalService, EnhancedContext } from './retrieval.service';
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

export class GenerationService {

  static async *streamResponse(
    sessionId: string,
    query: string,
    conversationHistory: ChatMessage[] = [],
    useRAG: boolean = true,
    attachmentIds?: string[],
    options?: RetrievalOptions
  ): AsyncGenerator<string> {
    try {
      let enhancedContexts: EnhancedContext[] = [];

      if (useRAG) {
        enhancedContexts = await RetrievalService.getRelevantContext(sessionId, query, attachmentIds, options);
      }

      const prompt = buildPrompt(query, enhancedContexts, conversationHistory);

      const contextStrings = enhancedContexts.map((ctx) => ctx.content);
      const estimatedTokens = estimatePromptTokens(
        prompt.substring(0, 1000),
        contextStrings,
        conversationHistory,
        query
      );
      logger.info('Generation', 'Stream prompt token estimate', { estimatedTokens, sessionId });

      let contents = [
        {
          role: 'user' as const,
          parts: [{ text: prompt }],
        },
      ];

      const tools = [callEndpointDeclaration];

      let iterationCount = 0;
      const maxIterations = 10;

      while (iterationCount < maxIterations) {
        iterationCount++;
        logger.debug('Generation', `Stream iteration ${iterationCount}`, { sessionId });

        const result = await ai.models.generateContent({
          model: MODEL,
          contents: contents,
          config: {
            tools: tools,
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        });

        let responseText = '';
        if (result.candidates && result.candidates[0] && result.candidates[0].content) {
          const parts = result.candidates[0].content.parts || [];
          const textParts = parts.filter((part) => part.text);
          responseText = textParts.map((part) => part.text).join(' ').trim();
        }

        console.log(`[Generation] Function calls found: ${result.functionCalls?.length || 0}`);

        if (result.functionCalls && result.functionCalls.length > 0) {
          const functionCall = result.functionCalls[0];
          const { name, args } = functionCall;

          if (!name || !toolFunctions[name]) {
            throw new Error(`Unknown function call: ${name}`);
          }

          if (!args || !args.url) {
            throw new Error(`Missing required 'url' argument for function: ${name}`);
          }

          console.log(`[Generation] Executing tool: ${name} with URL: ${args.url}`);
          const toolResponse = await toolFunctions[name](args.url as string);

          const functionResponsePart = {
            name: functionCall.name,
            response: {
              result: toolResponse,
            },
          };

          contents.push({
            role: 'model' as any,
            parts: result.candidates?.[0]?.content?.parts || [
              {
                functionCall: functionCall,
              } as any,
            ],
          });

          contents.push({
            role: 'user',
            parts: [
              {
                functionResponse: functionResponsePart,
              } as any,
            ],
          });

          continue;
        } else {
          logger.info('Generation', 'Streaming final response', { sessionId });

          const streamResult = await ai.models.generateContentStream({
            model: MODEL,
            contents: contents,
            config: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          });

          for await (const chunk of streamResult) {
            if (chunk.text) {
              yield chunk.text;
            }
          }

          return;
        }
      }

      logger.warn('Generation', `Reached maximum iterations in stream (${maxIterations})`, { sessionId });
      yield 'Maximum processing iterations reached. Please try rephrasing your question.';
    } catch (error) {
      logger.error('Generation', 'Error streaming response', error instanceof Error ? error : undefined, { sessionId });
      
      if (isGeminiError(error)) {
        throw parseGeminiError(error);
      }
      
      throw new ProcessingError('Failed to stream response');
    }
  }

  

    static async generateResponse(
    sessionId: string,
    query: string,
    conversationHistory: ChatMessage[] = [],
    useRAG: boolean = true,
    attachmentIds?: string[]
  ): Promise<string> {
    try {
      let enhancedContexts: EnhancedContext[] = [];

      if (useRAG) {
        enhancedContexts = await RetrievalService.getRelevantContext(sessionId, query, attachmentIds);
      }

      const prompt = buildPrompt(query, enhancedContexts, conversationHistory);

      const contextStrings = enhancedContexts.map((ctx) => ctx.content);
      const estimatedTokens = estimatePromptTokens(
        prompt.substring(0, 1000),
        contextStrings,
        conversationHistory,
        query
      );
      logger.info('Generation', 'Non-stream prompt token estimate', { estimatedTokens, sessionId });

      let contents = [
        {
          role: 'user' as const,
          parts: [{ text: prompt }],
        },
      ];

      const tools = [callEndpointDeclaration];

      let iterationCount = 0;
      const maxIterations = 10;
      let lastResponseText = '';

      while (iterationCount < maxIterations) {
        iterationCount++;
        logger.debug('Generation', `Iteration ${iterationCount}`, { sessionId });

        const result = await ai.models.generateContent({
          model: MODEL,
          contents: contents,
          config: {
            tools: tools,
            temperature: 0.7,
          },
        });

        let responseText = '';
        if (result.candidates && result.candidates[0] && result.candidates[0].content) {
          const parts = result.candidates[0].content.parts || [];
          const textParts = parts.filter((part) => part.text);
          responseText = textParts.map((part) => part.text).join(' ').trim();
        }

        lastResponseText = responseText;

        logger.debug('Generation', 'Response text', { preview: responseText.substring(0, 100), sessionId });
        logger.debug('Generation', 'Function calls found', { count: result.functionCalls?.length || 0, sessionId });

        if (result.functionCalls && result.functionCalls.length > 0) {
          const functionCall = result.functionCalls[0];
          const { name, args } = functionCall;

          if (!name || !toolFunctions[name]) {
            logger.error('Generation', `Unknown function call: ${name}`, undefined, { sessionId, functionCall });
            throw new ProcessingError(`Unknown function call: ${name}`);
          }

          if (!args || !args.url) {
            logger.error('Generation', `Missing required 'url' argument for function: ${name}`, undefined, { sessionId });
            throw new ProcessingError(`Missing required 'url' argument for function: ${name}`);
          }

          logger.info('Generation', `Executing tool: ${name}`, { url: args.url, sessionId });
          const toolResponse = await toolFunctions[name](args.url as string);

          const functionResponsePart = {
            name: functionCall.name,
            response: {
              result: toolResponse,
            },
          };

          contents.push({
            role: 'model' as any,
            parts: result.candidates?.[0]?.content?.parts || [
              {
                functionCall: functionCall,
              } as any,
            ],
          });

          contents.push({
            role: 'user',
            parts: [
              {
                functionResponse: functionResponsePart,
              } as any,
            ],
          });

          continue;
        } else {
          logger.info('Generation', 'Final response generated', { sessionId });
          return responseText || '';
        }
      }

      logger.warn('Generation', `Reached maximum iterations (${maxIterations}), returning last response`, { sessionId });
      return lastResponseText || 'Maximum processing iterations reached. Please try rephrasing your question.';
    } catch (error) {
      logger.error('Generation', 'Error generating response', error instanceof Error ? error : undefined, { sessionId });
      
      if (isGeminiError(error)) {
        throw parseGeminiError(error);
      }
      
      throw new ProcessingError('Failed to generate response');
    }
  }
}
