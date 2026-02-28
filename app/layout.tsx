import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { CurrencyProvider } from '@/components/top-bar'
import { WalletProvider } from '@/contexts/wallet-context'
import { Toaster } from 'sonner'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'LiquidGuard | Risk Protection for Decentralized Lending',
  description: 'Autonomous risk intelligence platform protecting users from liquidation in DeFi lending protocols. Monitor, predict, and protect your portfolio in real-time.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <CurrencyProvider>
            <WalletProvider>
              {children}
              <Toaster position="bottom-right" theme="light" />
            </WalletProvider>
          </CurrencyProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
