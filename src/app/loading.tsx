import { Building2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white selection:bg-blue-600">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        {/* Animated Brand Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl opacity-75 blur-lg animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50 border border-white/20">
            <Building2 className="w-8 h-8 text-white animate-bounce" />
          </div>
        </div>

        {/* Brand Name & Spinner */}
        <div className="space-y-1 mt-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            PG-SETU
          </h1>
          <p className="text-xs text-blue-200/80 font-medium">
            Loading secure PG management cloud...
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3 border border-slate-700/50">
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 rounded-full animate-indeterminate" />
        </div>
      </div>
    </div>
  )
}
