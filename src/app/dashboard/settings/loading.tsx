import React from 'react'

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse pb-24 px-3 sm:px-4">
      {/* Executive Host Hero Card Skeleton */}
      <div className="h-44 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex items-center justify-between" />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <div className="w-36 h-9 bg-gray-200 rounded-2xl" />
        <div className="w-36 h-9 bg-gray-100 rounded-2xl" />
        <div className="w-36 h-9 bg-gray-100 rounded-2xl" />
      </div>

      {/* 2-Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          <div className="h-48 bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3">
            <div className="w-40 h-4 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-50 rounded-xl" />
            <div className="h-10 bg-gray-50 rounded-xl" />
          </div>
          <div className="h-40 bg-white rounded-3xl border border-gray-200 p-5 shadow-xs space-y-3">
            <div className="w-40 h-4 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-50 rounded-xl" />
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="h-96 bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xs space-y-4">
            <div className="w-32 h-4 bg-gray-200 rounded" />
            <div className="h-28 bg-gray-50 rounded-2xl" />
            <div className="h-32 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
