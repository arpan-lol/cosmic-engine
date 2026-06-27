import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types/express';
import prisma from '../../prisma/client';
import { encrypt } from '../../utils/encryption.util';
import { ProcessingError, UnauthorizedError, ValidationError } from '../../types/errors';
import {
  getLLMModel,
  getProviderModels,
  isLLMModel,
  isLLMProvider,
  LLM_MODELS,
  LLMProvider,
} from '../../services/llm/model-catalog';

const providerToDb = {
  gemini: 'GEMINI',
  openai: 'OPENAI',
  anthropic: 'ANTHROPIC',
} as const;

const providerFromDb = {
  GEMINI: 'gemini',
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
} as const;

function requireUser(req: AuthRequest) {
  const userId = req.user?.userId;
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

function blockGuest(req: AuthRequest) {
  if (req.user?.email === 'guest@cosmicengine') {
    throw new UnauthorizedError('Log in to add your own model API keys');
  }
}

function keyPreview(apiKey: string) {
  return apiKey.slice(-4);
}

function serializeCredential(credential: {
  id: string;
  provider: keyof typeof providerFromDb;
  keyPreview: string;
  selectedModel: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: credential.id,
    provider: providerFromDb[credential.provider],
    keyPreview: credential.keyPreview,
    selectedModel: credential.selectedModel,
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  };
}

function resolveSelectedModel(provider: LLMProvider, selectedModel?: unknown) {
  const providerModels = getProviderModels(provider);
  const fallbackModel = providerModels[0]?.id;

  if (!fallbackModel) {
    throw new ValidationError('Provider is not configured');
  }

  if (!selectedModel) {
    return fallbackModel;
  }

  if (!isLLMModel(selectedModel)) {
    throw new ValidationError('Selected model is not supported');
  }

  const model = getLLMModel(selectedModel);
  if (!model || model.provider !== provider || model.source !== 'user') {
    throw new ValidationError('Selected model does not match provider');
  }

  return selectedModel;
}

export class ProviderController {
  static async getModels(req: AuthRequest, res: Response): Promise<Response> {
    return res.status(200).json({ models: LLM_MODELS });
  }

  static async getSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = requireUser(req);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { selectedModel: true },
      });

      if (!user) {
        throw new UnauthorizedError();
      }

      return res.status(200).json({
        settings: {
          selectedModel: user.selectedModel,
        },
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      next(new ProcessingError('Failed to fetch model settings'));
    }
  }

  static async updateSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = requireUser(req);
    blockGuest(req);

    const { selectedModel } = req.body;

    if (!isLLMModel(selectedModel)) {
      throw new ValidationError('Selected model is not supported');
    }

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { selectedModel },
        select: { selectedModel: true },
      });

      return res.status(200).json({
        settings: {
          selectedModel: user.selectedModel,
        },
      });
    } catch (error) {
      next(new ProcessingError('Failed to update model settings'));
    }
  }

  static async getCredentials(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = requireUser(req);

    try {
      const credentials = await prisma.providerCredential.findMany({
        where: { userId },
        orderBy: { provider: 'asc' },
      });

      return res.status(200).json({
        credentials: credentials.map(serializeCredential),
      });
    } catch (error) {
      next(new ProcessingError('Failed to fetch model API keys'));
    }
  }

  static async saveCredential(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = requireUser(req);
    blockGuest(req);

    const { provider, apiKey, selectedModel } = req.body;

    if (!isLLMProvider(provider)) {
      throw new ValidationError('Provider is required');
    }

    if (typeof apiKey !== 'string' || apiKey.trim().length < 8) {
      throw new ValidationError('API key is required');
    }

    const trimmedKey = apiKey.trim();
    const model = resolveSelectedModel(provider, selectedModel);

    try {
      const credential = await prisma.providerCredential.upsert({
        where: {
          userId_provider: {
            userId,
            provider: providerToDb[provider],
          },
        },
        update: {
          encryptedKey: encrypt(trimmedKey),
          keyPreview: keyPreview(trimmedKey),
          selectedModel: model,
        },
        create: {
          userId,
          provider: providerToDb[provider],
          encryptedKey: encrypt(trimmedKey),
          keyPreview: keyPreview(trimmedKey),
          selectedModel: model,
        },
      });

      return res.status(200).json({
        credential: serializeCredential(credential),
      });
    } catch (error) {
      next(new ProcessingError('Failed to save model API key'));
    }
  }

  static async deleteCredential(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    const userId = requireUser(req);
    blockGuest(req);

    const { provider } = req.params;

    if (!isLLMProvider(provider)) {
      throw new ValidationError('Provider is required');
    }

    try {
      await prisma.providerCredential.deleteMany({
        where: {
          userId,
          provider: providerToDb[provider],
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      next(new ProcessingError('Failed to delete model API key'));
    }
  }
}
