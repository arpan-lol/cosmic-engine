'use client';

import SessionList from '@/components/SessionList';

export default function SessionsPage() {
  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-muted-foreground">
          Manage your files and start new conversations
        </p>
      </div>
      <SessionList />
    </div>
  );
}
