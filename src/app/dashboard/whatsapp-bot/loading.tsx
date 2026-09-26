import React from 'react'

export default function WhatsAppBotLoading() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Bot Status & Settings Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="h-20 bg-gray-50 rounded-xl border border-gray-100" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-50 rounded-xl border border-gray-100" />
          <div className="h-32 bg-gray-50 rounded-xl border border-gray-100" />
        </div>
      </div>
    </div>
  )
}
