'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/dashboard')) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.35,
      wheelMultiplier: 0.7,
    });

    return () => {
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
