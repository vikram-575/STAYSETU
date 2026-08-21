export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-4 max-w-7xl mx-auto">
      {/* Top Banner Skeleton */}
      <div className="h-24 bg-slate-900 border border-slate-800 rounded-2xl p-5" />

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-6 w-20 bg-slate-700 rounded-lg" />
            <div className="h-2 w-14 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl h-64 space-y-3">
            <div className="h-5 w-36 bg-slate-800 rounded-lg" />
            <div className="h-40 bg-slate-950 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
