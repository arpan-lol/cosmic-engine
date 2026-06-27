export type LLMProvider = 'gemini' | 'openai' | 'anthropic';
export type LLMSource = 'platform' | 'user';

export interface LLMModel {
  id: string;
  provider: LLMProvider;
  source: LLMSource;
  providerModelId: string;
  name: string;
}

export const PLATFORM_GEMINI_MODEL = 'cosmicengine:gemini-2.5-flash';

export const LLM_MODELS: LLMModel[] = [
  {
    id: PLATFORM_GEMINI_MODEL,
    provider: 'gemini',
    source: 'platform',
    providerModelId: 'google:gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (free, limited)',
  },
  {
    id: 'google:gemini-2.5-flash',
    provider: 'gemini',
    source: 'user',
    providerModelId: 'google:gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
  },
  {
    id: 'google:gemini-2.5-pro',
    provider: 'gemini',
    source: 'user',
    providerModelId: 'google:gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
  },
  {
    id: 'openai:gpt-4.1-mini',
    provider: 'openai',
    source: 'user',
    providerModelId: 'openai:gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
  },
  {
    id: 'openai:gpt-4.1',
    provider: 'openai',
    source: 'user',
    providerModelId: 'openai:gpt-4.1',
    name: 'GPT-4.1',
  },
  {
    id: 'anthropic:claude-sonnet-4-20250514',
    provider: 'anthropic',
    source: 'user',
    providerModelId: 'anthropic:claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
  },
];

export function isLLMProvider(value: unknown): value is LLMProvider {
  return value === 'gemini' || value === 'openai' || value === 'anthropic';
}

export function getLLMModel(value: unknown): LLMModel | null {
  if (typeof value !== 'string') {
    return null;
  }

  return LLM_MODELS.find(model => model.id === value) ?? null;
}

export function isLLMModel(value: unknown): value is string {
  return getLLMModel(value) !== null;
}

export function getProviderModels(provider: LLMProvider): LLMModel[] {
  return LLM_MODELS.filter(model => model.provider === provider && model.source === 'user');
}