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
  title: 'Cosmic Engine',
  description: 'AI agent that can ingest, traverse and play around with any kind of media',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
