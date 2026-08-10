'use client';

import { AlertCircle, Bot, KeyRound, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLLMModels, useLLMSettings, useProviderCredentials } from '@/hooks/use-llm-settings';

export function ActiveModelBadge() {
  const { data: models } = useLLMModels();
  const { data: settings } = useLLMSettings();
  const { data: credentials } = useProviderCredentials();

  const model = models?.find(item => item.id === settings?.selectedModel);
  const credential = credentials?.find(item => item.provider === model?.provider);

  if (!model) {
    return null;
  }

  const isFree = model.source !== 'user';
  const hasKey = isFree || Boolean(credential);
  const Icon = isFree ? Zap : hasKey ? KeyRound : AlertCircle;
  const detail = isFree
    ? 'Cosmic Engine free Gemini access is selected for generation.'
    : hasKey
      ? `Using your ${model.provider} key ending in ${credential?.keyPreview}.`
      : `Add your ${model.provider} API key before using this model.`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="h-8 max-w-[240px] gap-1.5 rounded-md px-2 font-normal"
        >
          <Bot className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{model.name}</span>
          <Icon className="h-3.5 w-3.5 shrink-0" />
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-64">
        {detail}
      </TooltipContent>
    </Tooltip>
  );
}
