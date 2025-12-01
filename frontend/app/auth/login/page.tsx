'use client'

import { LoginForm } from '@/components/LoginForm';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <Image src="/logo.png" alt="Cosmic Engine" width={24} height={24} className="size-6" />
          Cosmic Engine
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
