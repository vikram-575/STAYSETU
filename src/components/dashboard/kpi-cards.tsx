'use client'

import { formatCurrency, formatCurrencyCompact } from '@/lib/money'
import { cn } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, BedDouble, Users,
  CreditCard, AlertCircle, DollarSign, BarChart2,
  ShieldCheck, Sparkles, CheckCircle2, Zap
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
  iconBg: string
  iconColor: string
  badge?: {
    text: string
    variant: 'positive' | 'negative' | 'neutral' | 'info'
  }
  highlight?: boolean
}

function KPICard({ label, value, sub, icon: Icon, iconBg, iconColor, badge, highlight }: KPICardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200',
      highlight
        ? 'border-blue-200 shadow-[0_2px_8px_rgba(37,99,235,0.06)] bg-gradient-to-b from-blue-50/30 to-white'
        : 'border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300'
    )}>
      {/* Header with Title and Icon */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-500 tracking-tight leading-none">{label}</span>
        <div className={cn('w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
        </div>
      </div>

      {/* Main Metric & Context */}
      <div>
        <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">{value}</p>
        {sub && (
          <p className="text-[11px] font-medium text-slate-400 mt-1 leading-none">{sub}</p>
        )}
      </div>

      {/* Footer Status Badge */}
      {badge && (
        <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center gap-1.5">
          <span className={cn(
            'inline-flex items-center gap-1 text-[10.5px] font-semibold leading-tight',
            badge.variant === 'positive' && 'text-emerald-700 font-bold',
            badge.variant === 'negative' && 'text-rose-700 font-bold',
            badge.variant === 'info' && 'text-blue-700 font-semibold',
            badge.variant === 'neutral' && 'text-slate-500 font-medium'
          )}>
            {badge.variant === 'positive' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
            {badge.variant === 'negative' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
            {badge.variant === 'info' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
            {badge.variant === 'neutral' && <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />}
            <span className="truncate">{badge.text}</span>
          </span>
        </div>
      )}
    </div>
  )
}

export default function DashboardKPICards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {/* 1. Expected */}
      <KPICard
        label="Expected Revenue"
        value={formatCurrency(kpis.monthExpectedPaise)}
        sub="Monthly billable target"
        icon={BarChart2}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        highlight
        badge={{
          text: `${kpis.activeResidents} active billings`,
          variant: 'info'
        }}
      />

      {/* 2. Collected */}
      <KPICard
        label="Total Collected"
        value={formatCurrency(kpis.monthCollectedPaise)}
        sub={`${kpis.collectionRate}% of expected`}
        icon={CreditCard}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
        badge={{
          text: `${kpis.collectionRate}% realization rate`,
          variant: kpis.collectionRate >= 80 ? 'positive' : kpis.collectionRate >= 50 ? 'info' : 'negative'
        }}
      />

      {/* 3. Outstanding */}
      <KPICard
        label="Total Outstanding"
        value={formatCurrency(kpis.totalOutstandingPaise)}
        sub="Pending resident dues"
        icon={AlertCircle}
        iconBg={kpis.totalOutstandingPaise > 0 ? 'bg-amber-50' : 'bg-slate-50'}
        iconColor={kpis.totalOutstandingPaise > 0 ? 'text-amber-600' : 'text-slate-400'}
        badge={{
          text: kpis.totalOutstandingPaise > 0 ? 'Collection in progress' : 'All clear!',
          variant: kpis.totalOutstandingPaise > 0 ? 'negative' : 'positive'
        }}
      />

      {/* 4. Overdue */}
      <KPICard
        label="Overdue Amount"
        value={formatCurrency(kpis.totalOverduePaise)}
        sub="Past due date"
        icon={TrendingDown}
        iconBg={kpis.totalOverduePaise > 0 ? 'bg-rose-50' : 'bg-slate-50'}
        iconColor={kpis.totalOverduePaise > 0 ? 'text-rose-600' : 'text-slate-400'}
        badge={{
          text: kpis.totalOverduePaise > 0 ? 'Urgent action required' : 'Zero overdue',
          variant: kpis.totalOverduePaise > 0 ? 'negative' : 'positive'
        }}
      />

      {/* 5. Today's Cash */}
      <KPICard
        label="Today's Collection"
        value={formatCurrency(kpis.todayCollectedPaise)}
        sub="Processed today"
        icon={DollarSign}
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
        badge={{
          text: kpis.todayCollectedPaise > 0 ? 'Live recorded' : 'No receipts yet today',
          variant: kpis.todayCollectedPaise > 0 ? 'positive' : 'neutral'
        }}
      />

      {/* 6. Occupancy */}
      <KPICard
        label="Bed Occupancy"
        value={`${kpis.occupancyRate}%`}
        sub={`${kpis.occupiedBeds} of ${kpis.totalBeds} beds filled`}
        icon={BedDouble}
        iconBg={kpis.occupancyRate >= 80 ? 'bg-emerald-50' : 'bg-amber-50'}
        iconColor={kpis.occupancyRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}
        badge={{
          text: `${kpis.availableBeds} beds available`,
          variant: kpis.occupancyRate >= 80 ? 'positive' : 'neutral'
        }}
      />

      {/* 7. Active Residents */}
      <KPICard
        label="Active Residents"
        value={String(kpis.activeResidents)}
        sub="Registered occupants"
        icon={Users}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
        badge={{
          text: `${kpis.occupiedBeds} checked-in`,
          variant: 'info'
        }}
      />

      {/* 8. Deposits Held */}
      <KPICard
        label="Deposits Held"
        value={formatCurrency(kpis.depositsHeldPaise)}
        sub="Refundable security"
        icon={ShieldCheck}
        iconBg="bg-teal-50"
        iconColor="text-teal-600"
        badge={{
          text: 'Escrow / Non-revenue',
          variant: 'neutral'
        }}
      />

      {/* 9. Available Beds */}
      <KPICard
        label="Available Beds"
        value={String(kpis.availableBeds)}
        sub="Ready for move-in"
        icon={BedDouble}
        iconBg="bg-slate-100"
        iconColor="text-slate-600"
        badge={{
          text: kpis.availableBeds > 0 ? `${kpis.availableBeds} vacant beds` : '100% full capacity',
          variant: kpis.availableBeds > 0 ? 'info' : 'positive'
        }}
      />

      {/* 10. Collection Realization */}
      <KPICard
        label="Realization Rate"
        value={`${kpis.collectionRate}%`}
        sub="Expected vs cash"
        icon={TrendingUp}
        iconBg={kpis.collectionRate >= 85 ? 'bg-emerald-50' : 'bg-amber-50'}
        iconColor={kpis.collectionRate >= 85 ? 'text-emerald-600' : 'text-amber-600'}
        badge={{
          text: kpis.collectionRate >= 85 ? 'High financial health' : 'Follow up pending',
          variant: kpis.collectionRate >= 85 ? 'positive' : 'neutral'
        }}
      />
    </div>
  )
}
