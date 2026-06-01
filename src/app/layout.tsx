import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

const heebo = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-sans', display: 'swap' })

export const metadata: Metadata = {
  title: 'Smokless',
  description: 'עקוב אחר הסיגריות שלך, השג יעדים, תתחרה עם חברים',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} dark`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
