'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserRole } from '@/lib/types'
import {
  LayoutDashboard, Users, Building2, BedDouble, FileText,
  CreditCard, Zap, BarChart3, MessageSquare, Settings,
  DollarSign, BookOpen, PackageSearch, LogOut,
  TrendingUp
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
  badge?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'manager', 'accountant', 'staff'] },
  { label: 'Residents', href: '/dashboard/residents', icon: Users, roles: ['owner', 'manager', 'accountant', 'staff'] },
  { label: 'Rooms & Beds', href: '/dashboard/rooms', icon: BedDouble, roles: ['owner', 'manager', 'staff'] },
  { label: 'Billing', href: '/dashboard/billing', icon: FileText, roles: ['owner', 'manager', 'accountant'] },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard, roles: ['owner', 'manager', 'accountant'] },
  { label: 'Ledger', href: '/dashboard/ledger', icon: BookOpen, roles: ['owner', 'manager', 'accountant'] },
  { label: 'Electricity', href: '/dashboard/electricity', icon: Zap, roles: ['owner', 'manager', 'staff'] },
  { label: 'Expenses', href: '/dashboard/expenses', icon: DollarSign, roles: ['owner', 'accountant', 'manager'] },
  { label: 'Money Center', href: '/dashboard/money', icon: TrendingUp, roles: ['owner', 'accountant'] },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['owner', 'manager', 'accountant'] },
  { label: 'Reports', href: '/dashboard/reports', icon: PackageSearch, roles: ['owner', 'manager', 'accountant'] },
  { label: 'Communications', href: '/dashboard/communications', icon: MessageSquare, roles: ['owner', 'manager', 'staff'] },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['owner'] },
]

interface Props {
  role: UserRole
  orgName: string
}

export default function AppSidebar({ role, orgName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">PG-SETU</p>
            <p className="text-xs text-gray-500 truncate">{orgName}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-blue-600' : 'text-gray-400')} />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
