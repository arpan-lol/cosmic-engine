'use client';

import SessionList from '@/components/SessionList';
import { useAuth } from '@/hooks/use-auth';

export default function SessionsPage() {
  const { data: user } = useAuth();

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Hello, {user?.name.split(' ')[0] || 'there'}</h1>
        <p className="text-muted-foreground">
          Click on a chat to begin interacting with the agent!
        </p>
      </div>
      <SessionList />
    </div>
  );
}
