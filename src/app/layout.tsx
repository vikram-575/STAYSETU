import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toast'
import Providers from '@/components/providers'
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-sans',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#16A34A',
}

export const metadata: Metadata = {
  title: 'PG-SETU — PropTech & PG Rental Network',
  description: 'Verified PGs, flats and co-living rentals with digital rent passbook and zero brokerage.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico', apple: '/icon-192.png' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PG-SETU',
  },
  applicationName: 'PG-SETU',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900 selection:bg-[#DCFCE7] selection:text-[#14532D]`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
