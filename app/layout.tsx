import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/hooks/use-theme'
import { SettingsProvider } from '@/contexts/settings-context'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'FamChat',
  description: 'A modern AI chat application with favorites and dark mode',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="famchat-theme"
        >
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
