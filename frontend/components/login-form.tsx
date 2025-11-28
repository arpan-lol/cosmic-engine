 'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { OAuthButtons } from './OAuthButtons';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const router = useRouter();
  const [loadingGuest, setLoadingGuest] = useState(false);

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome to Cosmic Engine</CardTitle>
          <CardDescription>
            Sign in to access your AI-powered document assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <OAuthButtons />
          </div>
          <CardDescription className="text-center mt-4">
            or,{' '}
            <button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                if (loadingGuest) return;
                setLoadingGuest(true);
                try {
                  console.log('[Guest] calling frontend route /auth/guest');
                  const response = await fetch('/auth/guest', { method: 'POST' });
                  const data = await response.json().catch(() => null);
                  console.log('[Guest] response', response.status, data);
                  if (response.ok && data?.success) {
                    router.push('/dashboard/sessions');
                    return;
                  }

                  // Fallback: try backend direct call
                  console.log('[Guest] falling back to backend /auth/guest');
                  const backendResp = await api.post('/auth/guest');
                  const backendData = await backendResp.json().catch(() => null);
                  console.log('[Guest] backend response', backendResp.status, backendData);
                  if (backendResp.ok && backendData?.success) {
                    router.push('/dashboard/sessions');
                  }
                } catch (error) {
                  console.error('Guest login failed:', error);
                } finally {
                  setLoadingGuest(false);
                }
              }}
              className="underline cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              {loadingGuest ? 'Logging in…' : 'login as a guest'}
              <span className="inline-block">→</span>
            </button>
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
