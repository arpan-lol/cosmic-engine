'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackHandler() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Completing sign in...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
