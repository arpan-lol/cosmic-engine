'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.35,
      wheelMultiplier: 0.7,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
