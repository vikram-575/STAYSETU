'use client'

import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, buildWhatsAppLink, buildSmsLink, initials } from '@/lib/utils'
import { MessageCircle, Phone, ExternalLink, AlertTriangle } from 'lucide-react'
import { ResidentCurrentView } from '@/lib/types'

interface Props {
  residents: ResidentCurrentView[]
}

export default function OutstandingResidentsList({ residents }: Props) {
  if (residents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Outstanding Residents</h2>
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          🎉 No outstanding balances!
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-gray-900">Who Owes Money?</h2>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{residents.length} residents with unpaid balance</p>
        </div>
        <Link href="/dashboard/billing?tab=outstanding" className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
          View all <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {residents.slice(0, 6).map((resident) => {
          const message = `Dear ${resident.full_name}, your PG outstanding balance is ${formatCurrency(resident.total_outstanding_paise)}. Reg No: ${resident.registration_number}. Please pay at the earliest. - PG Management`
          const waLink = buildWhatsAppLink(resident.phone, message)
          const smsLink = buildSmsLink(resident.phone, message)

          return (
            <div
              key={resident.resident_id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-blue-50/30 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-blue-700">
                  {resident.photo_url ? (
                    <img src={resident.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    initials(resident.full_name)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{resident.full_name}</p>
                    {resident.total_outstanding_paise > 500000 && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">
                    {resident.room_number ? `Room ${resident.room_number}` : ''}
                    {resident.bed_label ? ` · Bed ${resident.bed_label}` : ''}
                    {' · '}
                    <span className="font-mono">{resident.registration_number}</span>
                  </p>
                </div>
              </div>

              {/* Amount & Actions row on mobile, inline on desktop */}
              <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-gray-200/50">
                <div className="text-left sm:text-right">
                  <p className={cn(
                    'text-xs sm:text-sm font-black',
                    resident.total_outstanding_paise > 500000 ? 'text-red-600' : 'text-orange-600'
                  )}>
                    {formatCurrency(resident.total_outstanding_paise)}
                  </p>
                </div>

                {/* Touch Actions: Always visible on mobile, hover on desktop */}
                <div className="flex items-center gap-1">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Send WhatsApp reminder"
                    className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg active:scale-95 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <a
                    href={smsLink}
                    title="Send SMS"
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg active:scale-95 transition"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <Link
                    href={`/dashboard/residents/${resident.resident_id}`}
                    className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg active:scale-95 transition"
                    title="View Resident Profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {residents.length > 6 && (
        <Link
          href="/dashboard/billing?tab=outstanding"
          className="mt-3 block text-center text-xs text-blue-600 hover:text-blue-700 font-bold py-2.5 bg-blue-50/50 hover:bg-blue-50 border border-dashed border-blue-200 rounded-xl transition"
        >
          + {residents.length - 6} more residents with outstanding balance
        </Link>
      )}
    </div>
  )
}
