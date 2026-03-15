'use client'

import { LoginForm } from '@/components/LoginForm';
import Image from 'next/image';
import styles from './page.module.css';

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.patternContainer} aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="logoPattern"
              x="0"
              y="0"
              width="90"
              height="90"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-10)"
            >
              <image href="/favicon.ico" x="15" y="15" width="60" height="60" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#logoPattern)" />
        </svg>
      </div>
      <div className={styles.content}>
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <Image src="/logo.png" alt="Cosmic Engine" width={24} height={24} className="size-6" />
          Cosmic Engine
        </a>
        <LoginForm />
      </div>
    </div>
  );
}
