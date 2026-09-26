import React from 'react'

export default function ResidentsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-36 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 shadow-xs">
            <div className="w-20 h-3 bg-gray-200 rounded" />
            <div className="w-16 h-6 bg-gray-300 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-xs flex items-center justify-between gap-3">
        <div className="h-9 w-72 bg-gray-100 rounded-xl" />
        <div className="h-9 w-32 bg-gray-100 rounded-xl" />
      </div>

      {/* Table Rows Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="w-1/4 h-4 bg-gray-200 rounded" />
          <div className="w-1/4 h-4 bg-gray-200 rounded" />
          <div className="w-1/4 h-4 bg-gray-200 rounded" />
          <div className="w-1/4 h-4 bg-gray-200 rounded" />
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-1/4">
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-28 h-3.5 bg-gray-200 rounded" />
                  <div className="w-16 h-2.5 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="w-1/4 h-3.5 bg-gray-100 rounded" />
              <div className="w-1/4 h-3.5 bg-gray-100 rounded" />
              <div className="w-20 h-7 bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
