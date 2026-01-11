import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "next-themes";
import { cn } from '@/lib/utils'
import { Toaster } from 'sonner'
import Providers from '@/components/Providers'
import { GitHubButton } from '@/components/GitHubButton'
import { FileViewerProvider } from '@/contexts/FileViewerContext'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'], 
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-TNGB8PQ7SV"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-TNGB8PQ7SV');
            `,
          }}
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background text-foreground font-sans antialiased',
          geistSans.variable,
          geistMono.variable
        )}
      >
      <ThemeProvider attribute="class" defaultTheme="system">
        <FileViewerProvider>
          <div className="relative flex min-h-screen flex-col bg-background">
            <GitHubButton />
            <Providers>
              {children}
              <Toaster />
            </Providers>
          </div>
        </FileViewerProvider>
      </ThemeProvider>
      </body>
    </html>
  )
}
