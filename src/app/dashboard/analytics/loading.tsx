import React from 'react'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 shadow-xs">
            <div className="w-20 h-3 bg-gray-200 rounded" />
            <div className="w-24 h-7 bg-gray-300 rounded-lg" />
          </div>
        ))}
      </div>

      {/* 2 Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 h-72 shadow-xs space-y-4">
          <div className="w-36 h-4 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 h-72 shadow-xs space-y-4">
          <div className="w-36 h-4 bg-gray-200 rounded" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
