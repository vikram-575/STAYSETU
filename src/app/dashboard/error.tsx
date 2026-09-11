'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console or error tracking service
    console.error('Dashboard runtime error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 sm:p-8 text-center">
        <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
          <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
        </div>

        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          Unable to Load Dashboard
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {error?.message ||
            'We encountered an unexpected error while retrieving your PG management data. Your database and account remain secure.'}
        </p>

        {error?.digest && (
          <div className="mb-6 p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] font-mono text-slate-500 text-left overflow-x-auto">
            <span className="font-semibold text-slate-700">Digest:</span> {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-xs transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
