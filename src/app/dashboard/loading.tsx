export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-screen-2xl animate-pulse p-2 sm:p-4">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-gray-200 rounded-xl" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 p-4 rounded-2xl space-y-2.5 shadow-xs">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-7 w-24 bg-gray-300 rounded-lg" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Chart & Highlights Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-100 p-5 rounded-2xl h-72 shadow-xs space-y-4">
          <div className="h-5 w-40 bg-gray-200 rounded-lg" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-2xl h-72 shadow-xs space-y-4">
          <div className="h-5 w-32 bg-gray-200 rounded-lg" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="h-5 w-48 bg-gray-200 rounded-lg" />
        <div className="space-y-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-12 bg-gray-50 rounded-xl border border-gray-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
