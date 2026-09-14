'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { WebsiteContentProvider } from '@/context/website-content-context'

// Defer non-critical floating widget off critical rendering path
const InstantPgFloatingWidget = dynamic(
  () => import('@/components/shared/instant-pg-floating-widget'),
  { ssr: false }
)

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <WebsiteContentProvider>
        {children}
        <InstantPgFloatingWidget />
      </WebsiteContentProvider>
    </QueryClientProvider>
  )
}
