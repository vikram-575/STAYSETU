'use client'

import { formatCurrency } from '@/lib/money'
import { cn } from '@/lib/utils'
import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

interface Props {
  expectedPaise: number
  collectedPaise: number
  outstandingPaise: number
  overduePaise: number
  collectionRate: number
}

export default function ExpectedVsCollected({
  expectedPaise, collectedPaise, outstandingPaise, overduePaise, collectionRate
}: Props) {
  const pct = expectedPaise > 0 ? (collectedPaise / expectedPaise) * 100 : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Expected vs Collected — This Month</h2>
          <p className="text-xs text-gray-500 mt-0.5">Billing cycle comparison</p>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full',
          collectionRate >= 90 ? 'bg-green-50 text-green-700' :
          collectionRate >= 70 ? 'bg-yellow-50 text-yellow-700' :
          'bg-red-50 text-red-700'
        )}>
          <TrendingUp className="w-3.5 h-3.5" />
          {collectionRate}% collected
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{formatCurrency(collectedPaise)} collected</span>
          <span>{formatCurrency(expectedPaise)} expected</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700',
              pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* 4 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-600 font-medium mb-1">EXPECTED</p>
          <p className="text-xl font-bold text-blue-800">{formatCurrency(expectedPaise)}</p>
          <p className="text-xs text-blue-500 mt-0.5">Total billed</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            <p className="text-xs text-green-600 font-medium">COLLECTED</p>
          </div>
          <p className="text-xl font-bold text-green-800">{formatCurrency(collectedPaise)}</p>
          <p className="text-xs text-green-500 mt-0.5">Cash received</p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-orange-600" />
            <p className="text-xs text-orange-600 font-medium">OUTSTANDING</p>
          </div>
          <p className="text-xl font-bold text-orange-800">{formatCurrency(outstandingPaise)}</p>
          <p className="text-xs text-orange-500 mt-0.5">Pending</p>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <p className="text-xs text-red-600 font-medium">OVERDUE</p>
          </div>
          <p className="text-xl font-bold text-red-800">{formatCurrency(overduePaise)}</p>
          <p className="text-xs text-red-500 mt-0.5">Past due date</p>
        </div>
      </div>
    </div>
  )
}
