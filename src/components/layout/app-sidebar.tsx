'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserRole } from '@/lib/types'
import {
  LayoutDashboard, Users, Building2, BedDouble, FileText,
  CreditCard, Zap, BarChart3, MessageSquare, Settings,
  DollarSign, BookOpen, PackageSearch, LogOut,
  TrendingUp, ShieldAlert, Sparkles
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
  badge?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['superadmin', 'owner', 'manager', 'accountant', 'staff'] },
  { label: 'Residents CRM', href: '/dashboard/residents', icon: Users, roles: ['superadmin', 'owner', 'manager', 'accountant', 'staff'] },
  { label: 'Rooms & Beds', href: '/dashboard/rooms', icon: BedDouble, roles: ['superadmin', 'owner', 'manager', 'staff'] },
  { label: 'Billing & Invoices', href: '/dashboard/billing', icon: FileText, roles: ['superadmin', 'owner', 'manager', 'accountant'] },
  { label: 'Payments Register', href: '/dashboard/payments', icon: CreditCard, roles: ['superadmin', 'owner', 'manager', 'accountant'] },
  { label: 'Resident Ledger', href: '/dashboard/ledger', icon: BookOpen, roles: ['superadmin', 'owner', 'manager', 'accountant'] },
  { label: 'Electricity Sub-Meters', href: '/dashboard/electricity', icon: Zap, roles: ['superadmin', 'owner', 'manager', 'staff'] },
  { label: 'Expenses Tracking', href: '/dashboard/expenses', icon: DollarSign, roles: ['superadmin', 'owner', 'accountant', 'manager'] },
  { label: 'Money Center', href: '/dashboard/money', icon: TrendingUp, roles: ['superadmin', 'owner', 'accountant'] },
  { label: 'Financial Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['superadmin', 'owner', 'manager', 'accountant'] },
  { label: 'Reports & Audits', href: '/dashboard/reports', icon: PackageSearch, roles: ['superadmin', 'owner', 'manager', 'accountant'] },
  { label: 'WhatsApp Automation', href: '/dashboard/communications', icon: MessageSquare, roles: ['superadmin', 'owner', 'manager', 'staff'] },
  { label: 'PG Settings & GST', href: '/dashboard/settings', icon: Settings, roles: ['superadmin', 'owner'] },
]

interface Props {
  role: UserRole
  orgName: string
}

export default function AppSidebar({ role, orgName }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const visibleItems = navItems.filter((item) => item.roles.includes(role))
  const isSuperAdmin = role === 'superadmin'

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-full shrink-0">
      {/* Logo & Org Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-extrabold text-gray-900 text-sm leading-tight tracking-tight">PG-SETU</p>
              <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[10px] font-black rounded-md border border-blue-200">
                PRO
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{orgName}</p>
          </div>
        </div>
      </div>

      {/* Super Admin Command Center Link (If Super Admin) */}
      {isSuperAdmin && (
        <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 border-b border-slate-800">
          <Link
            href="/superman"
            className="flex items-center justify-between p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-white transition group"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
              <div className="text-left">
                <p className="text-xs font-black leading-tight text-blue-200">Super Admin Panel</p>
                <p className="text-[10px] text-slate-400">Manage all client PGs</p>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </Link>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {role === 'superadmin' ? 'Organization Management' : `${role.toUpperCase()} WORKSPACE`}
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-blue-600' : 'text-gray-400')} />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Status & Sign Out Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
          <div className="text-xs truncate">
            <span className="font-bold text-gray-700 block capitalize">{role} Account</span>
            <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live Connected
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
