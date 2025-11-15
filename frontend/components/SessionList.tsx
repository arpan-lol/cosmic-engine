'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessions, useCreateSession, useDeleteSession } from '@/hooks/use-sessions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, MessageSquare } from 'lucide-react';

export default function SessionList() {
  const router = useRouter();
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const { data: sessions, isLoading } = useSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();

  const handleCreateSession = async () => {
    const result = await createSession.mutateAsync(newSessionTitle || undefined);
    setNewSessionTitle('');
    router.push(`/dashboard/sessions/${result.sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteSession.mutateAsync(sessionId);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    router.push(`/dashboard/sessions/${sessionId}`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading sessions...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>New Session</CardTitle>
          <CardDescription>Start a new chat session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Session title (optional)"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
            />
            <Button onClick={handleCreateSession} disabled={createSession.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Sessions</CardTitle>
          <CardDescription>
            {sessions?.length || 0} session{sessions?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {sessions?.map((session) => (
                <Card
                  key={session.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelectSession(session.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {session.title || 'Untitled Session'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.createdAt).toLocaleDateString()} at{' '}
                            {new Date(session.createdAt).toLocaleTimeString()}
                          </p>
                          {session.messages && session.messages.length > 0 && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {session.messages[0].content}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        disabled={deleteSession.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {sessions?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No sessions yet. Create one to get started!
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
