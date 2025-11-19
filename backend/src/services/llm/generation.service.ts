import { GoogleGenAI, Type } from '@google/genai';
import { RetrievalService } from './retrieval.service';
import { buildPrompt } from './prompts/system.prompt';

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
      console.log(`[Tool] Fetched endpoint: ${url} (${responseText.length} chars)`);
      return responseText;
    } else {
      return `endpoint fetch failed with status: ${res.status} ${res.statusText}`;
    }
  } catch (err) {
    console.error('[Tool] Error fetching endpoint:', err);
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
    documentIds?: string[]
  ): AsyncGenerator<string> {
    try {
      let contextChunks: string[] = [];

      if (useRAG) {
        contextChunks = await RetrievalService.getRelevantContext(sessionId, query, 10, documentIds);
      }

      const prompt = buildPrompt(query, contextChunks, conversationHistory);

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
        console.log(`[Generation] Stream iteration ${iterationCount}`);

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
          console.log('[Generation] Streaming final response');

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

      console.warn(`[Generation] Reached maximum iterations in stream (${maxIterations})`);
      yield 'Maximum processing iterations reached. Please try rephrasing your question.';
    } catch (error) {
      console.error('[Generation] Error streaming response:', error);
      throw new Error('Failed to stream response');
    }
  }

  

    static async generateResponse(
    sessionId: string,
    query: string,
    conversationHistory: ChatMessage[] = [],
    useRAG: boolean = true,
    documentIds?: string[]
  ): Promise<string> {
    try {
      let contextChunks: string[] = [];

      if (useRAG) {
        contextChunks = await RetrievalService.getRelevantContext(sessionId, query, 5, documentIds);
      }

      const prompt = buildPrompt(query, contextChunks, conversationHistory);

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
        console.log(`[Generation] Iteration ${iterationCount}`);

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

        console.log(`[Generation] Response text: ${responseText.substring(0, 100)}...`);
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
          console.log('[Generation] Final response generated');
          return responseText || '';
        }
      }

      console.warn(`[Generation] Reached maximum iterations (${maxIterations}), returning last response`);
      return lastResponseText || 'Maximum processing iterations reached. Please try rephrasing your question.';
    } catch (error) {
      console.error('[Generation] Error generating response:', error);
      throw new Error('Failed to generate response');
    }
  }
}
