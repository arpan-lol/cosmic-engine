import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from "next-themes";
import { cn } from '@/lib/utils'
import { Toaster } from 'sonner'
import Providers from '@/components/Providers'
import { GitHubButton } from '@/components/GitHubButton'
import { FileViewerProvider } from '@/contexts/FileViewerContext'
import { SmoothScroll } from '@/components/SmoothScroll'

const metadataBase = new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000')

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'], 
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase,
  title: 'Cosmic Engine - RAG Experimentation Platform',
  description: 'A experimentation platform for playing around with 10+ RAG retrieval, chunking, generation, and caching strategies!',
  keywords: ['RAG', 'retrieval augmented generation', 'AI', 'chunking strategies', 'vector search', 'semantic search', 'caching', 'LLM', 'machine learning', 'document processing'],
  authors: [{ name: 'Cosmic Engine' }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Cosmic Engine - RAG Experimentation Platform',
    description: 'A experimentation platform for playing around with 10+ RAG retrieval, chunking, generation, and caching strategies!',
    type: 'website',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cosmic Engine - RAG Experimentation Platform',
    description: 'A experimentation platform for playing around with 10+ RAG retrieval, chunking, generation, and caching strategies!',
    images: ['/logo.png'],
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background text-foreground font-sans antialiased',
          geistSans.variable,
          geistMono.variable
        )}
      >
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-TNGB8PQ7SV"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-TNGB8PQ7SV');
        `}
      </Script>
      <ThemeProvider attribute="class" defaultTheme="system">
        <FileViewerProvider>
          <SmoothScroll>
            <div className="relative flex min-h-screen flex-col bg-background">
              <GitHubButton />
              <Providers>
                {children}
                <Toaster />
              </Providers>
            </div>
          </SmoothScroll>
        </FileViewerProvider>
      </ThemeProvider>
      </body>
    </html>
  )
}
