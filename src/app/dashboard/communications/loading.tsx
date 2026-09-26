import React from 'react'

export default function CommunicationsLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <div className="w-28 h-8 bg-gray-200 rounded-xl" />
        <div className="w-28 h-8 bg-gray-100 rounded-xl" />
      </div>

      {/* Campaign / Broadcast Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="w-40 h-4 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-50 rounded-xl border border-gray-100" />
        <div className="h-24 bg-gray-50 rounded-xl border border-gray-100" />
        <div className="w-32 h-10 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}
