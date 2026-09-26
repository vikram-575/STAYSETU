import React from 'react'

export default function ResidentLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl animate-pulse">
      {/* Back button & Action bar skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-20 h-4 bg-gray-200 rounded" />
          <div className="w-3 h-3 bg-gray-200 rounded-full" />
          <div className="w-32 h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-28 h-9 bg-gray-200 rounded-xl" />
          <div className="w-28 h-9 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* Resident Identity Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-200 shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-48 h-6 bg-gray-200 rounded-lg" />
                <div className="w-20 h-5 bg-gray-200 rounded-full" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-32 h-4 bg-gray-200 rounded" />
                <div className="w-28 h-4 bg-gray-200 rounded" />
              </div>
              <div className="w-40 h-4 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-32 h-10 bg-gray-200 rounded-xl" />
            <div className="w-32 h-10 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-2">
            <div className="w-24 h-3.5 bg-gray-200 rounded" />
            <div className="w-32 h-7 bg-gray-200 rounded-lg" />
            <div className="w-28 h-3 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Tabs navigation skeleton */}
      <div className="border-b border-gray-200 flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-24 h-9 bg-gray-200 rounded-t-lg" />
        ))}
      </div>

      {/* Tab body content skeleton */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="w-40 h-5 bg-gray-200 rounded" />
        <div className="space-y-3">
          <div className="w-full h-12 bg-gray-100 rounded-xl" />
          <div className="w-full h-12 bg-gray-100 rounded-xl" />
          <div className="w-full h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
