'use client';

import { useState } from 'react';
import { EngineEvent } from '@/lib/types';
import { Card } from '@/components/ui/card';
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
  const hasExpandableData = event.data && event.data.title && event.data.body?.length > 0;

  const getIcon = () => {
    if (event.type === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  return (
    <>
      <div className="flex justify-center my-4">
        <Card
          className={cn(
            'max-w-md px-4 py-3 flex items-center gap-3',
            hasExpandableData && 'cursor-pointer hover:bg-accent transition-colors',
            event.type === 'error' && 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
            event.type === 'notification' && 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
          )}
          onClick={() => hasExpandableData && setIsModalOpen(true)}
        >
          {getIcon()}
          <span className="text-sm flex-1">{event.message}</span>
          {hasExpandableData && (
            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
        </Card>
      </div>

      {hasExpandableData && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getIcon()}
                {event.data?.title}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription asChild>
              <div className="space-y-3 mt-4">
                {event.data?.body.map((item, index) => (
                  <p key={index} className="text-sm text-foreground">
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
