'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'

export default function AdminLogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    window.location.href = '/login'
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={
        className ||
        'py-2.5 px-3.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 hover:text-red-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer'
      }
      title="Sign out of Master Admin"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
      <span>{loading ? 'Signing out...' : 'Logout'}</span>
    </button>
  )
}
