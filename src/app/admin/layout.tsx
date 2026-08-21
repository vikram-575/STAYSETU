import { ReactNode } from 'react'
import Link from 'next/link'
import {
  Building2, ShieldCheck, ArrowLeft, LayoutDashboard,
  Users, CreditCard, Sparkles, LogOut, Layers, ExternalLink
} from 'lucide-react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Super Admin Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-white">PG-SETU</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Platform Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold">Multi-Tenant PG & SaaS Command Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" /> Switch to PG Dashboard
            </Link>
            <Link
              href="/portal"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-indigo-950/60 hover:bg-indigo-900/60 active:scale-95 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-800/50 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Tenant Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 space-y-6">
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>© 2026 PG-SETU Platform Enterprise · Multi-Tenant Cloud Architecture</p>
      </footer>
    </div>
  )
}
