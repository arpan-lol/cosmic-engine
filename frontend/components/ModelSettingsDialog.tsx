'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CircleHelp, KeyRound, Loader2, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useDeleteProviderCredential,
  useLLMModels,
  useLLMSettings,
  useProviderCredentials,
  useSaveProviderCredential,
  useUpdateLLMSettings,
} from '@/hooks/use-llm-settings';
import type { LLMModel, LLMProvider, User } from '@/lib/types';

interface ModelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Pick<User, 'email'>;
}

const providers: Array<{ id: LLMProvider; label: string }> = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
];

function providerLabel(provider: LLMProvider) {
  return providers.find(item => item.id === provider)?.label ?? provider;
}

function isPlatformModel(model: LLMModel) {
  return model.source !== 'user';
}

export function ModelSettingsDialog({ open, onOpenChange, user }: ModelSettingsDialogProps) {
  const isGuest = user.email === 'guest@cosmicengine';
  const { data: models = [], isLoading: modelsLoading } = useLLMModels();
  const { data: settings, isLoading: settingsLoading } = useLLMSettings();
  const { data: credentials = [], isLoading: credentialsLoading } = useProviderCredentials();
  const updateSettings = useUpdateLLMSettings();
  const saveCredential = useSaveProviderCredential();
  const deleteCredential = useDeleteProviderCredential();
  const [draftKeys, setDraftKeys] = useState<Record<LLMProvider, string>>({
    gemini: '',
    openai: '',
    anthropic: '',
  });
  const [credentialModels, setCredentialModels] = useState<Record<LLMProvider, string>>({
    gemini: '',
    openai: '',
    anthropic: '',
  });

  const credentialsByProvider = useMemo(() => {
    return new Map(credentials.map(credential => [credential.provider, credential]));
  }, [credentials]);

  useEffect(() => {
    const nextModels = { gemini: '', openai: '', anthropic: '' };
    providers.forEach(provider => {
      const saved = credentialsByProvider.get(provider.id)?.selectedModel;
      const first = models.find(model => model.provider === provider.id && model.source === 'user')?.id;
      nextModels[provider.id] = saved || first || '';
    });
    setCredentialModels(nextModels);
  }, [credentialsByProvider, models]);

  const selectedModel = models.find(model => model.id === settings?.selectedModel);
  const userModels = models.filter(model => model.source === 'user');
  const freeModels = models.filter(isPlatformModel);
  const selectedCredential = selectedModel ? credentialsByProvider.get(selectedModel.provider) : undefined;
  const selectedNeedsKey = selectedModel?.source === 'user' && !selectedCredential;

  const handleSelectedModelChange = async (modelId: string) => {
    const nextModel = models.find(model => model.id === modelId);
    if (isGuest) {
      toast.error('Log in to choose models and add API keys');
      return;
    }

    try {
      await updateSettings.mutateAsync(modelId);
      toast.success('Model updated');

      if (nextModel?.source === 'user' && !credentialsByProvider.has(nextModel.provider)) {
        toast.message(`Add your ${providerLabel(nextModel.provider)} API key before using ${nextModel.name}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update model');
    }
  };

  const handleSaveCredential = async (event: FormEvent, provider: LLMProvider) => {
    event.preventDefault();
    const apiKey = draftKeys[provider].trim();

    if (!apiKey) {
      toast.error(`Enter a ${providerLabel(provider)} API key`);
      return;
    }

    try {
      await saveCredential.mutateAsync({
        provider,
        apiKey,
        selectedModel: credentialModels[provider],
      });
      setDraftKeys(prev => ({ ...prev, [provider]: '' }));
      toast.success(`${providerLabel(provider)} key saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save API key');
    }
  };

  const handleDeleteCredential = async (provider: LLMProvider) => {
    try {
      await deleteCredential.mutateAsync(provider);
      toast.success(`${providerLabel(provider)} key removed`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove API key');
    }
  };

  const isBusy = modelsLoading || settingsLoading || credentialsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Model settings</DialogTitle>
          <DialogDescription>
            Pick the model used for generation and save encrypted API keys for paid providers.
          </DialogDescription>
        </DialogHeader>

        {isBusy ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Active model</Label>
              <Select
                value={settings?.selectedModel}
                onValueChange={handleSelectedModelChange}
                disabled={updateSettings.isPending || isGuest}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Cosmic Engine</SelectLabel>
                    {freeModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <Zap className="h-4 w-4" />
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Your API keys</SelectLabel>
                    {userModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        <KeyRound className="h-4 w-4" />
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {selectedModel && (
                  <Badge variant={selectedNeedsKey ? 'destructive' : 'secondary'} className="rounded-md">
                    {selectedNeedsKey
                      ? `Needs ${providerLabel(selectedModel.provider)} key`
                      : selectedModel.source === 'user'
                        ? `Using ${providerLabel(selectedModel.provider)} key`
                        : 'Free, limited'}
                  </Badge>
                )}
                {isGuest && <span>Log in to switch models or save API keys.</span>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Encrypted API keys</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <CircleHelp className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-72">
                    Keys are encrypted before storage and are only decrypted on the backend when a selected model needs them.
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-3">
                {providers.map(provider => {
                  const credential = credentialsByProvider.get(provider.id);
                  const providerModels = models.filter(model => model.provider === provider.id && model.source === 'user');

                  return (
                    <form
                      key={provider.id}
                      className="rounded-md border p-3"
                      onSubmit={(event) => handleSaveCredential(event, provider.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{provider.label}</p>
                            {credential ? (
                              <Badge variant="outline" className="rounded-md">Saved ending in {credential.keyPreview}</Badge>
                            ) : (
                              <Badge variant="secondary" className="rounded-md">No key</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {providerModels.map(model => model.name).join(', ')}
                          </p>
                        </div>
                        {credential && !isGuest && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCredential(provider.id)}
                            disabled={deleteCredential.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                        <Input
                          type="password"
                          placeholder={credential ? 'Paste a new key to replace it' : `${provider.label} API key`}
                          value={draftKeys[provider.id]}
                          onChange={(event) => setDraftKeys(prev => ({ ...prev, [provider.id]: event.target.value }))}
                          disabled={isGuest}
                          autoComplete="off"
                        />
                        <Select
                          value={credentialModels[provider.id]}
                          onValueChange={(value) => setCredentialModels(prev => ({ ...prev, [provider.id]: value }))}
                          disabled={isGuest || providerModels.length === 0}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Model" />
                          </SelectTrigger>
                          <SelectContent>
                            {providerModels.map(model => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="submit" disabled={isGuest || saveCredential.isPending}>
                          Save
                        </Button>
                      </div>
                    </form>
                  );
                })}
              </div>

              {selectedNeedsKey && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Add your {providerLabel(selectedModel.provider)} API key before sending messages with {selectedModel.name}.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
