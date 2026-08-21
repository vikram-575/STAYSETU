'use client'

import { formatCurrency } from '@/lib/money'
import { formatDateTime } from '@/lib/utils'
import { CreditCard, Banknote, Smartphone, Building2, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PaymentMethod } from '@/lib/types'

interface Payment {
  id: string
  payment_number: string
  amount_paise: number
  payment_method: PaymentMethod
  payment_time: string
  residents: { full_name: string; registration_number: string } | null
}

interface Props {
  payments: Payment[]
  todayPaise: number
}

const methodIcon: Record<PaymentMethod, React.ElementType> = {
  cash: Banknote,
  upi: Smartphone,
  bank_transfer: Building2,
  card: CreditCard,
  other: MoreHorizontal,
}

const methodLabel: Record<PaymentMethod, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  other: 'Other',
}

const methodColor: Record<PaymentMethod, string> = {
  cash: 'bg-green-50 text-green-600',
  upi: 'bg-purple-50 text-purple-600',
  bank_transfer: 'bg-blue-50 text-blue-600',
  card: 'bg-orange-50 text-orange-600',
  other: 'bg-gray-50 text-gray-600',
}

export default function RecentPaymentsFeed({ payments, todayPaise }: Props) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-gray-900">Recent Payments</h2>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
            Today: <span className="font-bold text-green-600">{formatCurrency(todayPaise)}</span>
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-xs text-gray-400">
          No payments recorded yet
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => {
            const Icon = methodIcon[payment.payment_method] ?? CreditCard
            return (
              <div key={payment.id} className="flex items-center gap-2.5 sm:gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100/60 transition-colors">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', methodColor[payment.payment_method])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {payment.residents?.full_name ?? 'Unknown Resident'}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">
                    {methodLabel[payment.payment_method]} · {formatDateTime(payment.payment_time)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs sm:text-sm font-black text-green-600">{formatCurrency(payment.amount_paise)}</p>
                  <p className="text-[10px] text-gray-400 font-mono truncate max-w-[80px] sm:max-w-none">{payment.payment_number}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
