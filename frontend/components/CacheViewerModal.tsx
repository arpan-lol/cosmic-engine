'use client';

import { CacheEntry } from '@/hooks/use-cache';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Zap, Calendar, Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CacheViewerModalProps {
  cache: CacheEntry[];
  trigger: React.ReactNode;
  isLoading?: boolean;
}

export function CacheViewerModal({ cache, trigger, isLoading }: CacheViewerModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-border/80">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Cache Viewer ({cache.length} entries)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            cache.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No cached queries found</p>
                <p className="text-sm">Cache entries will appear here as you use the system</p>
              </div>
            ) : (
              cache.map((entry) => (
                <Card key={entry.id} className="border-none">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        {entry.sessionTitle || `Session ${entry.sessionId.slice(-8)}`}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Last used {formatDistanceToNow(new Date(entry.lastSeenAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-500" />
                      Query
                    </h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {entry.query}
                    </p>
                  </div>

                  {entry.attachmentNames.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-500" />
                        Attachments ({entry.attachmentNames.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {entry.attachmentNames.map((filename, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {filename}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {entry.options && Object.keys(entry.options).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        Options
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(entry.options).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center text-sm p-2 bg-muted rounded-md">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                            <Badge variant={value ? "default" : "secondary"} className="text-xs">
                              {value ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}