import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogle } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, isStepCount, LanguageModel, ModelMessage, streamText, tool } from 'ai';
import { z } from 'zod';
import { logger } from '../../utils/logger.util';
import { LLMProvider } from './model-catalog';

interface LLMConfig {
  provider: LLMProvider;
  modelId: string;
  apiKey: string;
}

interface LLMGenerateParams extends LLMConfig {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

interface LLMStreamParams extends LLMConfig {
  instructions?: string;
  messages: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
  onToolResult?: (event: LLMToolEvent) => void | Promise<void>;
}

export interface LLMToolEvent {
  toolName: string;
  input: unknown;
  output: unknown;
  isError: boolean;
}

function getProviderModelId(provider: LLMProvider, modelId: string) {
  const [prefix, model] = modelId.split(':');

  if (!prefix || !model) {
    throw new Error('Invalid model id');
  }

  if (provider === 'gemini' && prefix !== 'google') {
    throw new Error('Model does not match provider');
  }

  if (provider !== 'gemini' && prefix !== provider) {
    throw new Error('Model does not match provider');
  }

  return model;
}

function getModel(config: LLMConfig): LanguageModel {
  const model = getProviderModelId(config.provider, config.modelId);

  if (config.provider === 'gemini') {
    return createGoogle({ apiKey: config.apiKey })(model);
  }

  if (config.provider === 'openai') {
    return createOpenAI({ apiKey: config.apiKey })(model);
  }

  return createAnthropic({ apiKey: config.apiKey })(model);
}

async function callEndpoint(url: string): Promise<string> {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      return `endpoint fetch failed with status: ${res.status} ${res.statusText}`;
    }

    const responseText = await res.text();
    logger.info('LLMAdapter-Tool', `Fetched endpoint: ${url}`, { length: responseText.length });
    return responseText;
  } catch (error) {
    logger.error('LLMAdapter-Tool', 'Error fetching endpoint', error instanceof Error ? error : undefined, { url });
    return `endpoint fetch failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

const tools = {
  Call_an_endpoint: tool({
    description: 'Sends and receives response from an HTTP Request to an API Endpoint on the internet',
    inputSchema: z.object({
      url: z.string().url(),
    }),
    execute: async ({ url }) => callEndpoint(url),
  }),
};

export class LLMAdapter {
  static async generate(params: LLMGenerateParams): Promise<string> {
    const result = await generateText({
      model: getModel(params),
      instructions: params.systemPrompt,
      prompt: params.userPrompt,
      tools,
      stopWhen: isStepCount(10),
      temperature: params.temperature ?? 0.5,
      maxOutputTokens: params.maxTokens ?? 500,
    });

    return result.text.trim();
  }

  static async *stream(params: LLMStreamParams): AsyncGenerator<string> {
    const result = streamText({
      model: getModel(params),
      instructions: params.instructions,
      messages: params.messages,
      tools,
      stopWhen: isStepCount(10),
      temperature: params.temperature ?? 0.7,
      maxOutputTokens: params.maxTokens ?? 2048,
      onStepEnd: async ({ toolResults }) => {
        if (!params.onToolResult) {
          return;
        }

        for (const result of toolResults) {
          const toolResult = result as any;
          await params.onToolResult({
            toolName: String(toolResult.toolName ?? 'tool'),
            input: toolResult.input,
            output: toolResult.output ?? toolResult.error,
            isError: toolResult.type === 'tool-error',
          });
        }
      },
    });

    for await (const textPart of result.textStream) {
      yield textPart;
    }
  }
}
