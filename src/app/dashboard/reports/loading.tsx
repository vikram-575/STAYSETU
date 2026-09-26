import React from 'react'

export default function ReportsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Reports Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-gray-100" />
            <div className="w-36 h-4 bg-gray-200 rounded" />
            <div className="w-48 h-3 bg-gray-100 rounded" />
            <div className="w-full h-9 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
