import React from 'react'

export default function RoomsLoading() {
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

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 shadow-xs">
            <div className="w-24 h-3 bg-gray-200 rounded" />
            <div className="w-16 h-6 bg-gray-300 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-xs flex items-center gap-3">
        <div className="h-9 w-40 bg-gray-100 rounded-xl" />
        <div className="h-9 w-40 bg-gray-100 rounded-xl" />
      </div>

      {/* Room Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <div className="w-24 h-5 bg-gray-200 rounded-lg" />
              <div className="w-16 h-5 bg-gray-100 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 bg-gray-50 rounded-xl border border-gray-100" />
              <div className="h-16 bg-gray-50 rounded-xl border border-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
