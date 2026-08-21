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
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-gray-900">Expected vs Collected — This Month</h2>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Billing cycle realization progress</p>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1 sm:py-1.5 rounded-full w-fit',
          collectionRate >= 90 ? 'bg-green-50 text-green-700' :
          collectionRate >= 70 ? 'bg-yellow-50 text-yellow-700' :
          'bg-red-50 text-red-700'
        )}>
          <TrendingUp className="w-3.5 h-3.5" />
          {collectionRate}% collected
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between text-[11px] sm:text-xs text-gray-500 font-semibold mb-1.5">
          <span className="text-green-700">{formatCurrency(collectedPaise)} collected</span>
          <span className="text-blue-700">{formatCurrency(expectedPaise)} expected</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 sm:h-4 overflow-hidden p-0.5">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="text-center p-3 sm:p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
          <p className="text-[10px] sm:text-xs text-blue-600 font-bold mb-0.5">EXPECTED</p>
          <p className="text-base sm:text-xl font-black text-blue-900 truncate" title={formatCurrency(expectedPaise)}>{formatCurrency(expectedPaise)}</p>
          <p className="text-[10px] text-blue-500 mt-0.5">Total billed</p>
        </div>
        <div className="text-center p-3 sm:p-4 bg-green-50/70 border border-green-100 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <CheckCircle2 className="w-3 h-3 text-green-600" />
            <p className="text-[10px] sm:text-xs text-green-600 font-bold">COLLECTED</p>
          </div>
          <p className="text-base sm:text-xl font-black text-green-900 truncate" title={formatCurrency(collectedPaise)}>{formatCurrency(collectedPaise)}</p>
          <p className="text-[10px] text-green-500 mt-0.5">Cash received</p>
        </div>
        <div className="text-center p-3 sm:p-4 bg-orange-50/70 border border-orange-100 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Clock className="w-3 h-3 text-orange-600" />
            <p className="text-[10px] sm:text-xs text-orange-600 font-bold">OUTSTANDING</p>
          </div>
          <p className="text-base sm:text-xl font-black text-orange-900 truncate" title={formatCurrency(outstandingPaise)}>{formatCurrency(outstandingPaise)}</p>
          <p className="text-[10px] text-orange-500 mt-0.5">Pending</p>
        </div>
        <div className="text-center p-3 sm:p-4 bg-red-50/70 border border-red-100 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <p className="text-[10px] sm:text-xs text-red-600 font-bold">OVERDUE</p>
          </div>
          <p className="text-base sm:text-xl font-black text-red-900 truncate" title={formatCurrency(overduePaise)}>{formatCurrency(overduePaise)}</p>
          <p className="text-[10px] text-red-500 mt-0.5">Past due date</p>
        </div>
      </div>
    </div>
  )
}
