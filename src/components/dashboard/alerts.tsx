'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/money'
import { AlertTriangle, Clock, FileWarning, BedDouble, BedSingle, CheckCircle2 } from 'lucide-react'

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
      icon: AlertTriangle,
      message: `${formatCurrency(overdueAmountPaise)} overdue from ${overdueCount} invoice${overdueCount !== 1 ? 's' : ''}`,
      href: '/dashboard/billing?tab=overdue',
    })
  }

  if (outstandingCount > 0) {
    alerts.push({
      level: 'warning',
      icon: Clock,
      message: `${outstandingCount} resident${outstandingCount !== 1 ? 's have' : ' has'} unpaid balance`,
      href: '/dashboard/billing?tab=outstanding',
    })
  }

  if (expiringDocs > 0) {
    alerts.push({
      level: 'warning',
      icon: FileWarning,
      message: `${expiringDocs} document${expiringDocs !== 1 ? 's' : ''} expiring within 30 days`,
      href: '/dashboard/residents?filter=expiring_docs',
    })
  }

  if (maintenanceBeds > 0) {
    alerts.push({
      level: 'info',
      icon: BedDouble,
      message: `${maintenanceBeds} bed${maintenanceBeds !== 1 ? 's' : ''} under maintenance`,
      href: '/dashboard/rooms',
    })
  }

  if (availableBeds > 0) {
    alerts.push({
      level: 'success',
      icon: BedSingle,
      message: `${availableBeds} bed${availableBeds !== 1 ? 's' : ''} available for new residents`,
      href: '/dashboard/rooms',
    })
  }

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        All clear — no outstanding alerts today!
      </div>
    )
  }

  const colorMap = {
    error: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    warning: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
    info: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    success: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
  }

  return (
    <div className="flex flex-wrap gap-2">
      {alerts.map((alert, i) => {
        const Icon = alert.icon
        return (
          <Link
            key={i}
            href={alert.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-medium transition-colors',
              colorMap[alert.level]
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {alert.message}
          </Link>
        )
      })}
    </div>
  )
}
