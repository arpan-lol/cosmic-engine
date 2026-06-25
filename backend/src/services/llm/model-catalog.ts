export type LLMProvider = 'gemini' | 'openai' | 'anthropic';

export interface LLMModel {
  id: string;
  provider: LLMProvider;
  name: string;
}

export const LLM_MODELS: LLMModel[] = [
  {
    id: 'google:gemini-2.5-flash',
    provider: 'gemini',
    name: 'Gemini 2.5 Flash',
  },
  {
    id: 'google:gemini-2.5-pro',
    provider: 'gemini',
    name: 'Gemini 2.5 Pro',
  },
  {
    id: 'openai:gpt-4.1-mini',
    provider: 'openai',
    name: 'GPT-4.1 Mini',
  },
  {
    id: 'openai:gpt-4.1',
    provider: 'openai',
    name: 'GPT-4.1',
  },
  {
    id: 'anthropic:claude-sonnet-4-20250514',
    provider: 'anthropic',
    name: 'Claude Sonnet 4',
  },
];

export function isLLMProvider(value: unknown): value is LLMProvider {
  return value === 'gemini' || value === 'openai' || value === 'anthropic';
}

export function isLLMModel(value: unknown): value is string {
  return typeof value === 'string' && LLM_MODELS.some(model => model.id === value);
}

export function getProviderModels(provider: LLMProvider): LLMModel[] {
  return LLM_MODELS.filter(model => model.provider === provider);
}
