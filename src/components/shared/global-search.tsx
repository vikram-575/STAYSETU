'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Users, BedDouble, CreditCard, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/money'

interface SearchResult {
  type: 'resident' | 'room' | 'bed' | 'payment' | 'invoice'
  id: string
  label: string
  sublabel: string
  href: string
  amount?: number
  status?: string
}

interface Props {
  onClose: () => void
}

export default function GlobalSearch({ onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)

    const results: SearchResult[] = []

    // Search residents by name, phone, registration number
    const { data: residents } = await supabase
      .from('v_resident_current')
      .select('resident_id,full_name,phone,registration_number,room_number,bed_label,status')
      .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,registration_number.ilike.%${q}%`)
      .limit(5)

    residents?.forEach((r) => {
      results.push({
        type: 'resident',
        id: r.resident_id,
        label: r.full_name,
        sublabel: `${r.registration_number} · ${r.room_number ?? ''}${r.bed_label ? '-' + r.bed_label : ''} · ${r.phone}`,
        href: `/dashboard/residents/${r.resident_id}`,
        status: r.status,
      })
    })

    // Search payments by payment number
    if (q.startsWith('PAY-') || q.match(/^\d+$/)) {
      const { data: payments } = await supabase
        .from('payments')
        .select('id,payment_number,amount_paise,payment_date,residents(full_name)')
        .ilike('payment_number', `%${q}%`)
        .limit(3)

      payments?.forEach((p) => {
        results.push({
          type: 'payment',
          id: p.id,
          label: p.payment_number,
          sublabel: `${(p.residents as any)?.full_name ?? ''} · ${p.payment_date}`,
          href: `/dashboard/payments/${p.id}`,
          amount: p.amount_paise,
        })
      })
    }

    // Search rooms by room number
    const { data: rooms } = await supabase
      .from('rooms')
      .select('id,room_number,name,capacity')
      .ilike('room_number', `%${q}%`)
      .limit(3)

    rooms?.forEach((r) => {
      results.push({
        type: 'room',
        id: r.id,
        label: `Room ${r.room_number}`,
        sublabel: `${r.name ?? ''} · Capacity: ${r.capacity}`,
        href: `/dashboard/rooms/${r.id}`,
      })
    })

    setResults(results)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'resident': return <Users className="w-4 h-4 text-blue-500" />
      case 'room': case 'bed': return <BedDouble className="w-4 h-4 text-green-500" />
      case 'payment': return <CreditCard className="w-4 h-4 text-purple-500" />
      case 'invoice': return <FileText className="w-4 h-4 text-orange-500" />
    }
  }

  const handleSelect = (result: SearchResult) => {
    router.push(result.href)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          {loading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin shrink-0" />
          ) : (
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
          )}
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search residents, rooms, payments, registration numbers..."
            className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="p-2 max-h-96 overflow-y-auto">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  {getIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{result.label}</p>
                  <p className="text-xs text-gray-500 truncate">{result.sublabel}</p>
                </div>
                {result.amount !== undefined && (
                  <span className="text-sm font-semibold text-gray-900 shrink-0">
                    {formatCurrency(result.amount)}
                  </span>
                )}
                {result.status && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                    result.status === 'active' ? 'bg-green-100 text-green-700' :
                    result.status === 'checked_out' ? 'bg-gray-100 text-gray-600' :
                    'bg-yellow-100 text-yellow-700'
                  )}>
                    {result.status.replace('_', ' ')}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
            No results found for &ldquo;{query}&rdquo;
          </div>
        )}

        {query.length < 2 && (
          <div className="p-4 text-center text-gray-400 text-xs">
            Type at least 2 characters to search
          </div>
        )}
      </div>
    </div>
  )
}
