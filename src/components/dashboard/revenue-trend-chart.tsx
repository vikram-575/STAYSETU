'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { format, parseISO, startOfMonth } from 'date-fns'
import { formatCurrency } from '@/lib/money'

interface Payment {
  amount_paise: number
  payment_date: string
}

interface Props {
  payments: Payment[]
}

export default function RevenueTrendChart({ payments }: Props) {
  // Group by month
  const byMonth: Record<string, number> = {}
  payments.forEach((p) => {
    const month = format(startOfMonth(parseISO(p.payment_date)), 'MMM yyyy')
    byMonth[month] = (byMonth[month] ?? 0) + p.amount_paise
  })

  const data = Object.entries(byMonth).map(([month, collected]) => ({
    month,
    collected: Math.round(collected / 100), // convert to rupees for display
  }))

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 h-64 flex items-center justify-center">
        <p className="text-sm text-gray-400">No payment data to display yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Collection Trend</h2>
      <p className="text-xs text-gray-500 mb-4">Monthly cash received (last 6 months)</p>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}`}
          />
          <Tooltip
            formatter={(value: any) => [`₹${(Number(value) || 0).toLocaleString('en-IN')}`, 'Collected']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
          />
          <Area
            type="monotone"
            dataKey="collected"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#colorCollected)"
            dot={{ fill: '#3B82F6', r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
