'use client';

import { useState } from 'react';
import { EngineEvent } from '@/lib/types';
import { ExternalLink, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SystemMessageProps {
  event: EngineEvent;
}

export function SystemMessage({ event }: SystemMessageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasExpandableData =
    event.data && event.data.title && event.data.body?.length > 0;

  const isError = event.type === 'error';

  const Icon = isError ? AlertCircle : Info;

  return (
    <>
      <div className="flex justify-center my-3 px-4">
        <div
          onClick={() => hasExpandableData && setIsModalOpen(true)}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2 text-sm',
            'max-w-full min-w-0 select-none',
            hasExpandableData && 'cursor-pointer hover:opacity-90',
            isError
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-card text-card-foreground'
          )}
        >
          <Icon className="w-4 h-4 shrink-0 opacity-90" />

          <span className="truncate">
            {event.message}
          </span>

          {hasExpandableData && (
            <ExternalLink className="w-4 h-4 shrink-0 opacity-70 ml-1" />
          )}
        </div>
      </div>

      {hasExpandableData && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {event.data?.title}
              </DialogTitle>
            </DialogHeader>

            <DialogDescription asChild>
              <div className="mt-4 space-y-2">
                {event.data?.body.map((item, index) => (
                  <p
                    key={index}
                    className="text-sm leading-relaxed text-foreground"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}