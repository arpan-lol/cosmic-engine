'use client';

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
                try {
                  const response = await api.post('/auth/guest');
                  const data = await response.json();
                  if (data.success) {
                    window.location.href = '/dashboard/sessions';
                  }
                } catch (error) {
                  console.error('Guest login failed:', error);
                }
              }}
              className="underline cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              login as a guest
              <span className="inline-block">→</span>
            </button>
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
