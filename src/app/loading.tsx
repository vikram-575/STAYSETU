import { Building2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 selection:bg-emerald-600 selection:text-white">
      {/* Subtle organic radial emerald backdrop glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(20,83,45,0.2)_0%,_rgba(2,6,23,0.95)_75%)] pointer-events-none" />

      <div className="relative flex flex-col items-center gap-4 text-center px-4 z-10">
        {/* Animated Brand Emblem Centered */}
        <div className="relative flex items-center justify-center">
          {/* Outer Breathing Emerald Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 rounded-3xl blur-xl animate-pulse" />
          
          {/* Subtle Spinning Ring Halo */}
          <div className="absolute -inset-2 rounded-2xl border border-emerald-500/20 border-t-emerald-400/80 animate-spin [animation-duration:3s]" />
          
          {/* Official PG-SETU Emerald Brand Shield */}
          <div className="relative w-16 h-16 bg-gradient-to-br from-[#14532D] via-[#15803D] to-[#16A34A] rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-950/80 ring-2 ring-emerald-400/20 border border-emerald-500/30">
            <Building2 className="w-8 h-8 text-white stroke-[2.2]" />
          </div>
        </div>

        {/* Brand Identity & Theme Text */}
        <div className="space-y-1 mt-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              PG-SETU
            </h1>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-md border border-emerald-500/30 tracking-wider">
              ERP
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Loading secure property network...
          </p>
        </div>

        {/* Theme-Matched Emerald Loading Shimmer Bar */}
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden mt-1 border border-slate-800">
          <div className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400 rounded-full animate-indeterminate" />
        </div>
      </div>
    </div>
  )
}
