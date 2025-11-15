'use client';

import { Button } from '@/components/ui/button';
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
        </CardContent>
      </Card>
      {/* Guest user implementation*/}
    </div>
  );
}
