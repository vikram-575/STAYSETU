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
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 h-48 sm:h-64 flex items-center justify-center shadow-xs">
        <p className="text-xs sm:text-sm text-gray-400">No revenue data yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs">
      <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-0.5">Revenue Sources</h2>
      <p className="text-[11px] sm:text-xs text-gray-500 mb-3 sm:mb-4">This month · {formatCurrency(total)} total</p>

      <div className="w-full h-[180px] sm:h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
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
      </div>

      {/* Legend as table */}
      <div className="space-y-1.5 mt-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-[11px] sm:text-xs">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-gray-600 flex-1 truncate">{item.name}</span>
            <span className="font-bold text-gray-900">{formatCurrency(item.value)}</span>
            <span className="text-gray-400 w-8 text-right font-mono">
              {total > 0 ? Math.round((item.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
