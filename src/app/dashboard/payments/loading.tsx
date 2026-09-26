import React from 'react'

export default function PaymentsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 shadow-xs">
            <div className="w-20 h-3 bg-gray-200 rounded" />
            <div className="w-24 h-6 bg-gray-300 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-xs flex items-center gap-3">
        <div className="h-9 w-36 bg-gray-100 rounded-xl" />
        <div className="h-9 w-36 bg-gray-100 rounded-xl" />
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between px-4">
            <div className="w-36 h-4 bg-gray-200 rounded" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
            <div className="w-16 h-6 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
