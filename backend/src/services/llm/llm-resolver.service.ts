import prisma from '../../prisma/client';
import { decrypt } from '../../utils/encryption.util';
import { ProcessingError, ValidationError } from '../../types/errors';
import { getGeminiKey } from './gemini-key-ring';
import { getLLMModel, LLMProvider } from './model-catalog';

export type LLMKeySource = 'platform' | 'user';

export interface LLMRuntime {
  provider: LLMProvider;
  modelId: string;
  selectedModel: string;
  modelName: string;
  apiKey: string;
  keySource: LLMKeySource;
  keyLabel: string;
  credentialId?: string;
  isGuest: boolean;
}

const providerToDb = {
  gemini: 'GEMINI',
  openai: 'OPENAI',
  anthropic: 'ANTHROPIC',
} as const;

function providerName(provider: LLMProvider) {
  if (provider === 'gemini') return 'Gemini';
  if (provider === 'openai') return 'OpenAI';
  return 'Anthropic';
}

export class LLMResolver {
  static async resolve(userId: number): Promise<LLMRuntime> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        selectedModel: true,
      },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    const isGuest = user.email === 'guest@cosmicengine';

    const model = getLLMModel(user.selectedModel);
    if (!model) {
      throw new ValidationError('Selected model is not supported');
    }

    if (model.source === 'platform') {
      try {
        const key = getGeminiKey();
        return {
          provider: model.provider,
          modelId: model.providerModelId,
          selectedModel: model.id,
          modelName: model.name,
          apiKey: key.value,
          keySource: 'platform',
          keyLabel: model.name,
          isGuest,
        };
      } catch (error) {
        throw new ProcessingError('Cosmic Engine free Gemini access is not configured');
      }
    }

    if (isGuest) {
      throw new ValidationError('Log in to use your own model API key');
    }

    const credential = await prisma.providerCredential.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: providerToDb[model.provider],
        },
      },
    });

    if (!credential) {
      throw new ValidationError(`Add your ${providerName(model.provider)} API key to use ${model.name}`);
    }

    try {
      return {
        provider: model.provider,
        modelId: model.providerModelId,
        selectedModel: model.id,
        modelName: model.name,
        apiKey: decrypt(credential.encryptedKey),
        keySource: 'user',
        keyLabel: `${providerName(model.provider)} key ending in ${credential.keyPreview}`,
        credentialId: credential.id,
        isGuest,
      };
    } catch (error) {
      throw new ProcessingError(`Failed to decrypt ${providerName(model.provider)} API key`);
    }
  }
}