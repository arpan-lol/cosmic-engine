'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const jwt = searchParams.get('jwt');
    if (jwt) {
      localStorage.setItem('jwt_token', jwt);
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Completing sign in...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
