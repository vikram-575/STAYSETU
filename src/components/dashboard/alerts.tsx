'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/money'
import { AlertCircle, Clock, FileWarning, BedDouble, CheckCircle2, ChevronRight } from 'lucide-react'

interface Props {
  overdueCount: number
  overdueAmountPaise: number
  outstandingCount: number
  expiringDocs: number
  maintenanceBeds: number
  availableBeds: number
}

interface AlertItem {
  level: 'error' | 'warning' | 'info' | 'success'
  icon: React.ElementType
  message: string
  href: string
}

export default function DashboardAlerts({
  overdueCount, overdueAmountPaise, outstandingCount,
  expiringDocs, maintenanceBeds, availableBeds
}: Props) {
  const alerts: AlertItem[] = []

  if (overdueAmountPaise > 0) {
    alerts.push({
      level: 'error',
      icon: AlertCircle,
      message: `${formatCurrency(overdueAmountPaise)} overdue (${overdueCount} invoice${overdueCount !== 1 ? 's' : ''})`,
      href: '/dashboard/billing',
    })
  }

  if (outstandingCount > 0) {
    alerts.push({
      level: 'warning',
      icon: Clock,
      message: `${outstandingCount} resident${outstandingCount !== 1 ? 's have' : ' has'} pending dues`,
      href: '/dashboard/billing',
    })
  }

  if (expiringDocs > 0) {
    alerts.push({
      level: 'warning',
      icon: FileWarning,
      message: `${expiringDocs} KYC document${expiringDocs !== 1 ? 's' : ''} expiring soon`,
      href: '/dashboard/residents',
    })
  }

  if (maintenanceBeds > 0) {
    alerts.push({
      level: 'info',
      icon: BedDouble,
      message: `${maintenanceBeds} bed${maintenanceBeds !== 1 ? 's' : ''} in maintenance`,
      href: '/dashboard/rooms',
    })
  }

  if (availableBeds > 0) {
    alerts.push({
      level: 'info',
      icon: BedDouble,
      message: `${availableBeds} vacant bed${availableBeds !== 1 ? 's' : ''} ready for check-in`,
      href: '/dashboard/rooms',
    })
  }

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-xs font-semibold text-emerald-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>All systems clear — zero overdue invoices or pending alerts today!</span>
      </div>
    )
  }

  const badgeStyles = {
    error: 'bg-rose-50/80 border-rose-200/90 text-rose-700 hover:bg-rose-100/80',
    warning: 'bg-amber-50/80 border-amber-200/90 text-amber-800 hover:bg-amber-100/80',
    info: 'bg-blue-50/80 border-blue-200/90 text-blue-700 hover:bg-blue-100/80',
    success: 'bg-emerald-50/80 border-emerald-200/90 text-emerald-700 hover:bg-emerald-100/80',
  }

  return (
    <div className="overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-2 w-max sm:w-auto flex-nowrap sm:flex-wrap">
        {alerts.map((alert, i) => {
          const Icon = alert.icon
          return (
            <Link
              key={i}
              href={alert.href}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-[11px] font-semibold transition active:scale-95 shadow-[0_1px_2px_rgba(0,0,0,0.02)] whitespace-nowrap group',
                badgeStyles[alert.level]
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
              <span>{alert.message}</span>
              <ChevronRight className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
