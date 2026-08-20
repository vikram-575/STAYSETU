'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/money'

interface Props {
  breakdown: Record<string, number>
}

const COLORS: Record<string, string> = {
  rent: '#3B82F6',
  electricity: '#F59E0B',
  food: '#10B981',
  beverage: '#8B5CF6',
  laundry: '#EC4899',
  cleaning: '#06B6D4',
  parking: '#6366F1',
  other: '#9CA3AF',
  late_fee: '#EF4444',
  damage: '#F97316',
}

const LABELS: Record<string, string> = {
  rent: 'Rent', electricity: 'Electricity', food: 'Food',
  beverage: 'Beverage', laundry: 'Laundry', cleaning: 'Cleaning',
  parking: 'Parking', other: 'Other', late_fee: 'Late Fee', damage: 'Damage',
}

export default function RevenueBreakdownChart({ breakdown }: Props) {
  const data = Object.entries(breakdown)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: LABELS[key] ?? key,
      value,
      color: COLORS[key] ?? '#9CA3AF',
    }))
    .sort((a, b) => b.value - a.value)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
        <p className="text-sm text-gray-400">No revenue data yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Revenue Sources</h2>
      <p className="text-xs text-gray-500 mb-4">This month · {formatCurrency(total)} total</p>

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => [formatCurrency(Number(value) || 0), '']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend as table */}
      <div className="space-y-2 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-xs text-gray-600 flex-1">{item.name}</span>
            <span className="text-xs font-semibold text-gray-900">{formatCurrency(item.value)}</span>
            <span className="text-xs text-gray-400 w-10 text-right">
              {total > 0 ? Math.round((item.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
