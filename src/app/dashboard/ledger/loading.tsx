import React from 'react'

export default function LedgerLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Resident Selector Strip */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="h-10 w-72 bg-gray-100 rounded-xl" />
        <div className="h-10 w-32 bg-gray-100 rounded-xl" />
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2 shadow-xs">
            <div className="w-24 h-3 bg-gray-200 rounded" />
            <div className="w-32 h-7 bg-gray-300 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Ledger Entries Table */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between px-4">
            <div className="w-28 h-4 bg-gray-200 rounded" />
            <div className="w-48 h-4 bg-gray-200 rounded" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
