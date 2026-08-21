'use client'

import { formatCurrency, formatCurrencyCompact } from '@/lib/money'
import { cn } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, BedDouble, Users,
  CreditCard, AlertCircle, DollarSign, BarChart2
} from 'lucide-react'

interface KPIs {
  totalBeds: number
  occupiedBeds: number
  availableBeds: number
  maintenanceBeds: number
  occupancyRate: number
  activeResidents: number
  monthExpectedPaise: number
  monthCollectedPaise: number
  monthOutstandingPaise: number
  totalOutstandingPaise: number
  totalOverduePaise: number
  todayCollectedPaise: number
  collectionRate: number
  depositsHeldPaise: number
}

interface Props { kpis: KPIs }

interface KPICardProps {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  highlight?: boolean
}

function KPICard({ label, value, sub, icon: Icon, color, trend, trendLabel, highlight }: KPICardProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl sm:rounded-2xl border p-3.5 sm:p-5 flex flex-col justify-between gap-2.5 shadow-xs transition-shadow',
      highlight ? 'border-blue-300 shadow-sm shadow-blue-100 bg-blue-50/10' : 'border-gray-200 hover:border-gray-300'
    )}>
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider truncate" title={label}>{label}</span>
        <div className={cn('w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0', color)}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
      <div>
        <p className="text-lg sm:text-2xl font-black text-gray-900 leading-tight tracking-tight truncate" title={value}>{value}</p>
        {sub && <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate" title={sub}>{sub}</p>}
      </div>
      {trendLabel && (
        <div className={cn(
          'flex items-center gap-1 text-[10px] sm:text-xs font-semibold truncate pt-1 border-t border-gray-100',
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
        )}>
          {trend === 'up' && <TrendingUp className="w-3 h-3 shrink-0" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3 shrink-0" />}
          <span className="truncate">{trendLabel}</span>
        </div>
      )}
    </div>
  )
}

export default function DashboardKPICards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
      <KPICard
        label="Expected This Month"
        value={formatCurrencyCompact(kpis.monthExpectedPaise)}
        sub={formatCurrency(kpis.monthExpectedPaise)}
        icon={BarChart2}
        color="bg-blue-50 text-blue-600"
        highlight
      />
      <KPICard
        label="Collected This Month"
        value={formatCurrencyCompact(kpis.monthCollectedPaise)}
        sub={formatCurrency(kpis.monthCollectedPaise)}
        icon={CreditCard}
        color="bg-green-50 text-green-600"
        trend="up"
        trendLabel={`${kpis.collectionRate}% collection rate`}
      />
      <KPICard
        label="Total Outstanding"
        value={formatCurrencyCompact(kpis.totalOutstandingPaise)}
        sub={formatCurrency(kpis.totalOutstandingPaise)}
        icon={AlertCircle}
        color={kpis.totalOutstandingPaise > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}
        trend={kpis.totalOutstandingPaise > 0 ? 'down' : 'neutral'}
        trendLabel={kpis.totalOutstandingPaise > 0 ? 'Needs collection' : 'All clear!'}
      />
      <KPICard
        label="Overdue"
        value={formatCurrencyCompact(kpis.totalOverduePaise)}
        sub={formatCurrency(kpis.totalOverduePaise)}
        icon={TrendingDown}
        color={kpis.totalOverduePaise > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}
        trend={kpis.totalOverduePaise > 0 ? 'down' : 'neutral'}
        trendLabel={kpis.totalOverduePaise > 0 ? 'Overdue – action needed' : 'No overdue'}
      />
      <KPICard
        label="Today's Collection"
        value={formatCurrencyCompact(kpis.todayCollectedPaise)}
        sub={formatCurrency(kpis.todayCollectedPaise)}
        icon={DollarSign}
        color="bg-indigo-50 text-indigo-600"
      />
      <KPICard
        label="Occupancy"
        value={`${kpis.occupancyRate}%`}
        sub={`${kpis.occupiedBeds} / ${kpis.totalBeds} beds filled`}
        icon={BedDouble}
        color={kpis.occupancyRate >= 80 ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}
        trend={kpis.occupancyRate >= 80 ? 'up' : 'neutral'}
        trendLabel={`${kpis.availableBeds} beds available`}
      />
      <KPICard
        label="Active Residents"
        value={String(kpis.activeResidents)}
        sub={`${kpis.occupiedBeds} beds occupied`}
        icon={Users}
        color="bg-purple-50 text-purple-600"
      />
      <KPICard
        label="Deposits Held"
        value={formatCurrencyCompact(kpis.depositsHeldPaise)}
        sub="Security deposits (not revenue)"
        icon={DollarSign}
        color="bg-teal-50 text-teal-600"
      />
      <KPICard
        label="Available Beds"
        value={String(kpis.availableBeds)}
        sub={`${kpis.maintenanceBeds} in maintenance`}
        icon={BedDouble}
        color="bg-gray-50 text-gray-600"
        trend={kpis.availableBeds > 0 ? 'neutral' : 'up'}
        trendLabel={kpis.availableBeds > 0 ? `Est. ₹${Math.round(kpis.availableBeds * (kpis.monthExpectedPaise / Math.max(kpis.occupiedBeds, 1)) / 100).toLocaleString('en-IN')} potential/month` : 'Fully occupied!'}
      />
      <KPICard
        label="Collection Rate"
        value={`${kpis.collectionRate}%`}
        sub={`${formatCurrencyCompact(kpis.monthCollectedPaise)} of ${formatCurrencyCompact(kpis.monthExpectedPaise)}`}
        icon={TrendingUp}
        color={kpis.collectionRate >= 90 ? 'bg-green-50 text-green-600' : kpis.collectionRate >= 70 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}
        trend={kpis.collectionRate >= 90 ? 'up' : kpis.collectionRate >= 70 ? 'neutral' : 'down'}
        trendLabel={kpis.collectionRate >= 90 ? 'Excellent' : kpis.collectionRate >= 70 ? 'Good' : 'Needs attention'}
      />
    </div>
  )
}
