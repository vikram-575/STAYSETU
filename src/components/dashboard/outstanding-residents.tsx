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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Who Owes Money?</h2>
          <p className="text-xs text-gray-500 mt-0.5">{residents.length} residents with unpaid balance</p>
        </div>
        <Link href="/dashboard/billing?tab=outstanding" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          View all <ExternalLink className="w-3 h-3" />
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
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-sm font-bold text-blue-700">
                {resident.photo_url ? (
                  <img src={resident.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  initials(resident.full_name)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{resident.full_name}</p>
                  {resident.total_outstanding_paise > 500000 && (
                    <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {resident.room_number ? `Room ${resident.room_number}` : ''}
                  {resident.bed_label ? `-${resident.bed_label}` : ''}
                  {' · '}
                  {resident.registration_number}
                </p>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className={cn(
                  'text-sm font-bold',
                  resident.total_outstanding_paise > 500000 ? 'text-red-600' : 'text-orange-600'
                )}>
                  {formatCurrency(resident.total_outstanding_paise)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Send WhatsApp reminder"
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
                <a
                  href={smsLink}
                  title="Send SMS"
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <Link
                  href={`/dashboard/residents/${resident.resident_id}`}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {residents.length > 6 && (
        <Link
          href="/dashboard/billing?tab=outstanding"
          className="mt-3 block text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-2 border border-dashed border-blue-200 rounded-lg"
        >
          + {residents.length - 6} more residents with outstanding balance
        </Link>
      )}
    </div>
  )
}
