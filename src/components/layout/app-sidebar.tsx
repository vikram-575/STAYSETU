'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserRole } from '@/lib/types'
import {
  LayoutDashboard, Users, Building2, BedDouble, FileText,
  CreditCard, Zap, BarChart3, MessageSquare, Settings,
  DollarSign, BookOpen, PackageSearch, LogOut,
  TrendingUp, ShieldAlert, Sparkles, Compass,
  Landmark, BookCheck, Fingerprint, Utensils, Wrench,
  UploadCloud, UserCheck, Percent, Coins, Bot, Palette
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
  { label: 'Bank Reconcile (VAN)', href: '/dashboard/reconciliation', icon: Landmark, roles: ['superadmin', 'owner', 'accountant'], badge: 'VAN' },
  { label: 'Tally Accounting', href: '/dashboard/accounting', icon: BookCheck, roles: ['superadmin', 'owner', 'accountant'] },
  { label: 'Biometric Turnstile', href: '/dashboard/biometric', icon: Fingerprint, roles: ['superadmin', 'owner', 'manager', 'staff'] },
  { label: 'Mess & Food Costing', href: '/dashboard/mess', icon: Utensils, roles: ['superadmin', 'owner', 'manager', 'staff'] },
  { label: 'Preventive AMC', href: '/dashboard/maintenance', icon: Wrench, roles: ['superadmin', 'owner', 'manager', 'staff'] },
  { label: 'Bulk CSV Import', href: '/dashboard/residents/bulk-import', icon: UploadCloud, roles: ['superadmin', 'owner', 'manager'] },
  { label: 'Staff & Payroll', href: '/dashboard/staff', icon: UserCheck, roles: ['superadmin', 'owner', 'accountant'] },
  { label: 'Dynamic Pricing Rules', href: '/dashboard/pricing-rules', icon: Percent, roles: ['superadmin', 'owner'] },
  { label: 'Cashier Vault Closing', href: '/dashboard/vault', icon: Coins, roles: ['superadmin', 'owner', 'manager', 'accountant'] },
  { label: 'AI WhatsApp Bot', href: '/dashboard/whatsapp-bot', icon: Bot, roles: ['superadmin', 'owner', 'manager'] },
  { label: 'Resident Ledger', href: '/dashboard/ledger', icon: BookOpen, roles: ['superadmin', 'owner', 'manager', 'accountant'] },
  { label: 'Electricity Sub-Meters', href: '/dashboard/electricity', icon: Zap, roles: ['superadmin', 'owner', 'manager', 'staff'] },
  { label: 'Expenses Tracking', href: '/dashboard/expenses', icon: DollarSign, roles: ['superadmin', 'owner', 'accountant', 'manager'] },
  { label: 'Money Center', href: '/dashboard/money', icon: TrendingUp, roles: ['superadmin', 'owner', 'accountant'] },
  { label: 'Financial Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['superadmin', 'owner', 'manager', 'accountant'] },
  { label: 'Reports & Audits', href: '/dashboard/reports', icon: PackageSearch, roles: ['superadmin', 'owner', 'manager', 'accountant'] },
  { label: 'WhatsApp Automation', href: '/dashboard/communications', icon: MessageSquare, roles: ['superadmin', 'owner', 'manager', 'staff'] },
  { label: 'White-Label Branding', href: '/dashboard/white-label', icon: Palette, roles: ['superadmin', 'owner'] },
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
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200/90 flex-col h-full shrink-0 shadow-xs select-none">
      {/* Logo & Org Header */}
      <div className="p-4 border-b border-gray-100 bg-[#F7FAF7]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#14532D] to-[#16A34A] rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-2 ring-[#DCFCE7]">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-black text-[#14532D] text-sm leading-tight tracking-tight">PG-SETU</p>
              <span className="px-1.5 py-0.2 bg-[#DCFCE7] text-[#14532D] text-[10px] font-black rounded-md border border-[#16A34A]/25">
                ERP
              </span>
            </div>
            <p className="text-xs text-[#647067] font-semibold truncate mt-0.5" title={orgName}>
              {orgName}
            </p>
          </div>
        </div>
      </div>

      {/* Quick link to public marketplace */}
      <div className="px-3 pt-2.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-gray-200 bg-[#F7FAF7] text-[11px] font-semibold text-[#647067] hover:border-[#16A34A] hover:text-[#14532D] transition"
        >
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>View Public Marketplace</span>
          </div>
          <span className="text-[10px] text-gray-400">↗</span>
        </Link>
      </div>

      {/* Super Admin Command Center Link (If Super Admin) */}
      {isSuperAdmin && (
        <div className="p-3 bg-gradient-to-r from-[#14532D] to-[#166534] border-b border-emerald-800/40 text-white">
          <Link
            href="/superman"
            className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition group"
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FEF3C7] group-hover:text-white" />
              <div className="text-left">
                <p className="text-xs font-black leading-tight text-[#DCFCE7]">Super Admin Panel</p>
                <p className="text-[10px] text-gray-200">Manage all client PGs</p>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-[#FEF3C7]" />
          </Link>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {role === 'superadmin' ? 'Organization Operations' : `${role.toUpperCase()} WORKSPACE`}
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
                  ? 'bg-[#DCFCE7]/70 text-[#14532D] font-bold shadow-xs'
                  : 'text-[#647067] hover:bg-[#F7FAF7] hover:text-[#17211B]'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#16A34A]' : 'text-gray-400')} />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Status & Sign Out Footer */}
      <div className="p-3 border-t border-gray-100 bg-[#F7FAF7]/80">
        <div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
          <div className="text-xs truncate">
            <span className="font-bold text-[#17211B] block capitalize">{role} Account</span>
            <span className="text-[10px] text-[#16A34A] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              Live Connected
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-xs font-bold text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
