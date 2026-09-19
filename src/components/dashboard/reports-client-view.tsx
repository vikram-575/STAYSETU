'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import {
  FileText, Download, Printer, Filter, Calendar,
  DollarSign, CreditCard, Users, BedDouble, Zap, ShieldCheck,
  Search, RefreshCw, AlertTriangle, CheckCircle2, TrendingUp,
  Receipt, ArrowUpRight, ArrowDownRight, Wallet, X
} from 'lucide-react'

interface ReportsClientViewProps {
  initialType?: string
  invoices: any[]
  payments: any[]
  expenses: any[]
  residents: any[]
}

export function ReportsClientView({
  initialType = 'revenue',
  invoices = [],
  payments = [],
  expenses = [],
  residents = [],
}: ReportsClientViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>(initialType)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Instant tab change without server reload
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey)
    setSearchQuery('')
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('type', tabKey)
      window.history.replaceState({}, '', url.toString())
    }
  }

  // Refresh server data in background
  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 700)
  }

  // Native Print
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Filtered datasets for instant in-memory search
  const q = searchQuery.toLowerCase().trim()

  const filteredInvoices = useMemo(() => {
    if (!q) return invoices
    return invoices.filter((inv) =>
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.residents?.full_name?.toLowerCase().includes(q) ||
      inv.status?.toLowerCase().includes(q)
    )
  }, [invoices, q])

  const filteredPayments = useMemo(() => {
    if (!q) return payments
    return payments.filter((p) =>
      p.payment_number?.toLowerCase().includes(q) ||
      p.residents?.full_name?.toLowerCase().includes(q) ||
      p.payment_method?.toLowerCase().includes(q) ||
      p.transaction_id?.toLowerCase().includes(q)
    )
  }, [payments, q])

  const outstandingResidents = useMemo(() => {
    return residents.filter((r) => (r.total_outstanding_paise || 0) > 0)
  }, [residents])

  const filteredOutstanding = useMemo(() => {
    if (!q) return outstandingResidents
    return outstandingResidents.filter((r) =>
      r.full_name?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) ||
      r.registration_number?.toLowerCase().includes(q) ||
      String(r.room_number || '').toLowerCase().includes(q)
    )
  }, [outstandingResidents, q])

  const filteredExpenses = useMemo(() => {
    if (!q) return expenses
    return expenses.filter((e) =>
      e.category?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.vendor?.toLowerCase().includes(q)
    )
  }, [expenses, q])

  const filteredOccupancy = useMemo(() => {
    if (!q) return residents
    return residents.filter((r) =>
      r.full_name?.toLowerCase().includes(q) ||
      r.registration_number?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) ||
      String(r.room_number || '').toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    )
  }, [residents, q])

  // Summary Metrics calculations
  const revenueMetrics = useMemo(() => {
    const totalBilled = invoices.reduce((sum, i) => sum + (i.total_paise || 0), 0)
    const totalPaid = invoices.reduce((sum, i) => sum + (i.paid_paise || 0), 0)
    const totalBalance = invoices.reduce((sum, i) => sum + (i.balance_paise || 0), 0)
    const rate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100
    return { totalBilled, totalPaid, totalBalance, rate }
  }, [invoices])

  const collectionsMetrics = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => sum + (p.amount_paise || 0), 0)
    const upiCollected = payments
      .filter((p) => p.payment_method?.toLowerCase() === 'upi')
      .reduce((sum, p) => sum + (p.amount_paise || 0), 0)
    const cashCollected = payments
      .filter((p) => p.payment_method?.toLowerCase() === 'cash')
      .reduce((sum, p) => sum + (p.amount_paise || 0), 0)
    return { totalCollected, upiCollected, cashCollected, count: payments.length }
  }, [payments])

  const outstandingMetrics = useMemo(() => {
    const totalDue = outstandingResidents.reduce((sum, r) => sum + (r.total_outstanding_paise || 0), 0)
    const count = outstandingResidents.length
    const maxDue = outstandingResidents.reduce((max, r) => Math.max(max, r.total_outstanding_paise || 0), 0)
    return { totalDue, count, maxDue }
  }, [outstandingResidents])

  const expenseMetrics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount_paise || 0), 0)
    return { totalExpenses, count: expenses.length }
  }, [expenses])

  const occupancyMetrics = useMemo(() => {
    const active = residents.filter((r) => r.status === 'active')
    const totalRent = active.reduce((sum, r) => sum + (r.monthly_rent_paise || 0), 0)
    return { total: residents.length, activeCount: active.length, totalRent }
  }, [residents])

  // Instant CSV Download
  const handleExportCSV = () => {
    let headers: string[] = []
    let rows: (string | number)[][] = []
    const today = new Date().toISOString().split('T')[0]
    let filename = `report-${activeTab}-${today}.csv`

    if (activeTab === 'revenue') {
      headers = ['Invoice #', 'Resident Name', 'Period Start', 'Period End', 'Total (INR)', 'Paid (INR)', 'Balance (INR)', 'Status']
      rows = filteredInvoices.map((inv) => [
        inv.invoice_number || '',
        inv.residents?.full_name || 'Unknown',
        inv.period_start || '',
        inv.period_end || '',
        ((inv.total_paise || 0) / 100).toFixed(2),
        ((inv.paid_paise || 0) / 100).toFixed(2),
        ((inv.balance_paise || 0) / 100).toFixed(2),
        inv.status || '',
      ])
      filename = `revenue-statement-${today}.csv`
    } else if (activeTab === 'collections') {
      headers = ['Payment #', 'Resident Name', 'Payment Date', 'Method', 'Transaction ID', 'Amount (INR)']
      rows = filteredPayments.map((p) => [
        p.payment_number || '',
        p.residents?.full_name || 'Unknown',
        p.payment_date || '',
        p.payment_method || '',
        p.transaction_id || '',
        ((p.amount_paise || 0) / 100).toFixed(2),
      ])
      filename = `collection-register-${today}.csv`
    } else if (activeTab === 'outstanding') {
      headers = ['Resident Name', 'Registration #', 'Room', 'Bed', 'Phone', 'Outstanding Amount (INR)']
      rows = filteredOutstanding.map((r) => [
        r.full_name || '',
        r.registration_number || '',
        r.room_number || '',
        r.bed_label || '',
        r.phone || '',
        ((r.total_outstanding_paise || 0) / 100).toFixed(2),
      ])
      filename = `outstanding-dues-${today}.csv`
    } else if (activeTab === 'expenses') {
      headers = ['Date', 'Category', 'Description', 'Vendor', 'Amount (INR)']
      rows = filteredExpenses.map((e) => [
        e.expense_date || '',
        e.category || '',
        e.description || '',
        e.vendor || '',
        ((e.amount_paise || 0) / 100).toFixed(2),
      ])
      filename = `expense-audit-${today}.csv`
    } else if (activeTab === 'occupancy') {
      headers = ['Resident Name', 'Registration #', 'Room', 'Bed', 'Monthly Rent (INR)', 'Check-in Date', 'Status']
      rows = filteredOccupancy.map((r) => [
        r.full_name || '',
        r.registration_number || '',
        r.room_number || '',
        r.bed_label || '',
        (((r.monthly_rent_paise || 0)) / 100).toFixed(2),
        r.check_in_date || '',
        r.status || '',
      ])
      filename = `occupancy-log-${today}.csv`
    }

    const csvContent = [
      headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) => row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Header with Title and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Reports &amp; Financial Statements
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Audit-ready reporting · Tax export · Occupancy &amp; Revenue Ledgers
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh database records"
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-gray-500', isRefreshing && 'animate-spin text-emerald-600')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            title="Print report"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            title="Export active table to CSV"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#14532D] hover:bg-[#166534] active:scale-95 transition rounded-xl shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Types Tabs with Instant 0ms Local Switching */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 bg-gray-100/90 p-1.5 rounded-2xl text-xs font-bold w-max border border-gray-200/70 shadow-2xs">
          {[
            { key: 'revenue', label: 'Revenue Statement', count: invoices.length },
            { key: 'collections', label: 'Collection Register', count: payments.length },
            { key: 'outstanding', label: 'Outstanding Dues', count: outstandingResidents.length, isWarning: outstandingResidents.length > 0 },
            { key: 'expenses', label: 'Expense Audit', count: expenses.length },
            { key: 'occupancy', label: 'Occupancy Log', count: residents.length },
          ].map((t) => {
            const isActive = activeTab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleTabChange(t.key)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer text-xs font-bold',
                  isActive
                    ? 'bg-white text-blue-700 shadow-xs ring-1 ring-black/5 font-extrabold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                )}
              >
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none',
                      isActive
                        ? t.isWarning ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
                        : t.isWarning ? 'bg-red-50 text-red-600' : 'bg-gray-200/80 text-gray-700'
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Contextual KPI Cards per Tab */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Invoiced</span>
            <p className="text-lg sm:text-xl font-black text-gray-900 mt-1">{formatCurrency(revenueMetrics.totalBilled)}</p>
            <span className="text-[10px] text-gray-400 font-medium">{invoices.length} invoices generated</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Realized</span>
            <p className="text-lg sm:text-xl font-black text-emerald-600 mt-1">{formatCurrency(revenueMetrics.totalPaid)}</p>
            <span className="text-[10px] text-emerald-700 font-semibold">{revenueMetrics.rate}% recovery rate</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">Pending Balance</span>
            <p className="text-lg sm:text-xl font-black text-red-600 mt-1">{formatCurrency(revenueMetrics.totalBalance)}</p>
            <span className="text-[10px] text-red-500 font-medium">Overdue &amp; unpaid</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Realization Rate</span>
            <p className="text-lg sm:text-xl font-black text-blue-700 mt-1">{revenueMetrics.rate}%</p>
            <span className="text-[10px] text-blue-600 font-medium">Billed vs collected</span>
          </div>
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Collected</span>
            <p className="text-lg sm:text-xl font-black text-emerald-600 mt-1">{formatCurrency(collectionsMetrics.totalCollected)}</p>
            <span className="text-[10px] text-gray-400 font-medium">{collectionsMetrics.count} transactions</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">UPI / Digital</span>
            <p className="text-lg sm:text-xl font-black text-blue-800 mt-1">{formatCurrency(collectionsMetrics.upiCollected)}</p>
            <span className="text-[10px] text-gray-400 font-medium">Direct bank settlement</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Cash / Counter</span>
            <p className="text-lg sm:text-xl font-black text-amber-900 mt-1">{formatCurrency(collectionsMetrics.cashCollected)}</p>
            <span className="text-[10px] text-gray-400 font-medium">Physical receipts</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Average Receipt</span>
            <p className="text-lg sm:text-xl font-black text-gray-900 mt-1">
              {collectionsMetrics.count > 0 ? formatCurrency(Math.round(collectionsMetrics.totalCollected / collectionsMetrics.count)) : '₹0'}
            </p>
            <span className="text-[10px] text-gray-400 font-medium">Per collection</span>
          </div>
        </div>
      )}

      {activeTab === 'outstanding' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-red-200 shadow-2xs bg-red-50/30">
            <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider block">Total Uncollected Dues</span>
            <p className="text-lg sm:text-xl font-black text-red-600 mt-1">{formatCurrency(outstandingMetrics.totalDue)}</p>
            <span className="text-[10px] text-red-600 font-medium">Across all properties</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Defaulter Residents</span>
            <p className="text-lg sm:text-xl font-black text-gray-900 mt-1">{outstandingMetrics.count}</p>
            <span className="text-[10px] text-gray-400 font-medium">Residents with balance &gt; 0</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Highest Single Due</span>
            <p className="text-lg sm:text-xl font-black text-red-700 mt-1">{formatCurrency(outstandingMetrics.maxDue)}</p>
            <span className="text-[10px] text-gray-400 font-medium">Action priority</span>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Disbursed Expenses</span>
            <p className="text-lg sm:text-xl font-black text-red-600 mt-1">{formatCurrency(expenseMetrics.totalExpenses)}</p>
            <span className="text-[10px] text-gray-400 font-medium">Maintenance, utilities &amp; supplies</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Expense Entries</span>
            <p className="text-lg sm:text-xl font-black text-gray-900 mt-1">{expenseMetrics.count}</p>
            <span className="text-[10px] text-gray-400 font-medium">Vouchers logged</span>
          </div>
        </div>
      )}

      {activeTab === 'occupancy' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Active Occupants</span>
            <p className="text-lg sm:text-xl font-black text-[#14532D] mt-1">{occupancyMetrics.activeCount}</p>
            <span className="text-[10px] text-gray-400 font-medium">Currently residing</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Monthly Rental Run-Rate</span>
            <p className="text-lg sm:text-xl font-black text-gray-900 mt-1">{formatCurrency(occupancyMetrics.totalRent)}/mo</p>
            <span className="text-[10px] text-gray-400 font-medium">Expected base gross</span>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-2xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Registered Profiles</span>
            <p className="text-lg sm:text-xl font-black text-gray-900 mt-1">{occupancyMetrics.total}</p>
            <span className="text-[10px] text-gray-400 font-medium">Historical &amp; active roster</span>
          </div>
        </div>
      )}

      {/* Report Table Container Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Table Toolbar: Title & Live Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wide">
              {activeTab.replace('_', ' ')} Statement
            </h2>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
              Live Verified
            </span>
          </div>

          {/* Instant Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'revenue'
                  ? 'Filter by invoice, resident, status...'
                  : activeTab === 'collections'
                  ? 'Filter by payment #, resident, method...'
                  : activeTab === 'outstanding'
                  ? 'Filter by name, room, phone...'
                  : activeTab === 'expenses'
                  ? 'Filter category, vendor, note...'
                  : 'Filter resident, room, status...'
              }
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#14532D] focus:ring-2 focus:ring-[#14532D]/10 transition placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 1. REVENUE STATEMENT TAB */}
        {activeTab === 'revenue' && (
          <div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
              {filteredInvoices && filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv: any) => (
                  <div key={inv.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-600 block">{inv.invoice_number}</span>
                        <p className="font-bold text-xs text-gray-900 mt-0.5">{inv.residents?.full_name || 'Resident'}</p>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] uppercase font-bold',
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        )}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded-xl border border-gray-100 text-center">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Total</span>
                        <span className="font-bold text-gray-900">{formatCurrency(inv.total_paise)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Paid</span>
                        <span className="font-bold text-green-600">{formatCurrency(inv.paid_paise)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Balance</span>
                        <span className="font-black text-red-600">{formatCurrency(inv.balance_paise)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                  {searchQuery ? `No invoices matching "${searchQuery}"` : 'No invoices found.'}
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/80 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5 font-bold">Invoice #</th>
                    <th className="py-3 px-3.5 font-bold">Resident</th>
                    <th className="py-3 px-3.5 font-bold">Period</th>
                    <th className="py-3 px-3.5 text-right font-bold">Total</th>
                    <th className="py-3 px-3.5 text-right font-bold">Paid</th>
                    <th className="py-3 px-3.5 text-right font-bold">Balance Due</th>
                    <th className="py-3 px-3.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredInvoices && filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600">{inv.invoice_number}</td>
                        <td className="py-2.5 px-3.5 font-bold text-gray-900">{inv.residents?.full_name || '—'}</td>
                        <td className="py-2.5 px-3.5 text-gray-600">{formatDate(inv.period_start)} – {formatDate(inv.period_end)}</td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-gray-900">{formatCurrency(inv.total_paise)}</td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-emerald-600">{formatCurrency(inv.paid_paise)}</td>
                        <td className="py-2.5 px-3.5 text-right font-black text-red-600">{formatCurrency(inv.balance_paise)}</td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] uppercase font-bold',
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                        {searchQuery ? `No invoices matching "${searchQuery}"` : 'No invoices generated yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. COLLECTION REGISTER TAB */}
        {activeTab === 'collections' && (
          <div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
              {filteredPayments && filteredPayments.length > 0 ? (
                filteredPayments.map((p: any) => (
                  <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-gray-900 block">{p.payment_number}</span>
                        <p className="font-bold text-xs text-gray-900 mt-0.5">{p.residents?.full_name || 'Resident'}</p>
                      </div>
                      <span className="text-base font-black text-emerald-600">{formatCurrency(p.amount_paise)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">
                        {p.payment_method}
                      </span>
                      <span className="text-[10px] text-gray-500">{formatDate(p.payment_date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                  {searchQuery ? `No payments matching "${searchQuery}"` : 'No payments found.'}
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/80 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5 font-bold">Payment #</th>
                    <th className="py-3 px-3.5 font-bold">Resident</th>
                    <th className="py-3 px-3.5 font-bold">Date</th>
                    <th className="py-3 px-3.5 font-bold">Method</th>
                    <th className="py-3 px-3.5 font-bold">Transaction Ref ID</th>
                    <th className="py-3 px-3.5 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredPayments && filteredPayments.length > 0 ? (
                    filteredPayments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-gray-900">{p.payment_number}</td>
                        <td className="py-2.5 px-3.5 font-bold text-gray-900">{p.residents?.full_name || '—'}</td>
                        <td className="py-2.5 px-3.5 text-gray-600">{formatDate(p.payment_date)}</td>
                        <td className="py-2.5 px-3.5 uppercase font-bold text-gray-700">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px]">{p.payment_method}</span>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-[11px] text-gray-500">{p.transaction_id || '—'}</td>
                        <td className="py-2.5 px-3.5 text-right font-extrabold text-emerald-600 text-sm">
                          {formatCurrency(p.amount_paise)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                        {searchQuery ? `No payments matching "${searchQuery}"` : 'No payments recorded.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. OUTSTANDING DUES TAB */}
        {activeTab === 'outstanding' && (
          <div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
              {filteredOutstanding && filteredOutstanding.length > 0 ? (
                filteredOutstanding.map((r: any) => (
                  <div key={r.resident_id} className="bg-white p-3.5 rounded-2xl border border-red-200 shadow-2xs space-y-2.5 bg-red-50/10">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900">{r.full_name}</h3>
                        <p className="text-[11px] text-gray-500">Room {r.room_number || '—'} · Bed {r.bed_label || '—'}</p>
                      </div>
                      <span className="text-base font-black text-red-600">{formatCurrency(r.total_outstanding_paise)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <span className="font-mono text-[10px] text-gray-500">{r.registration_number}</span>
                      <span className="text-[10px] text-gray-700 font-bold">{r.phone}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                  {searchQuery ? `No outstanding records matching "${searchQuery}"` : 'All accounts are cleared! Zero outstanding dues.'}
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/80 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5 font-bold">Resident</th>
                    <th className="py-3 px-3.5 font-bold">Registration #</th>
                    <th className="py-3 px-3.5 font-bold">Room / Bed</th>
                    <th className="py-3 px-3.5 font-bold">Phone Number</th>
                    <th className="py-3 px-3.5 text-right font-bold">Total Overdue Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredOutstanding && filteredOutstanding.length > 0 ? (
                    filteredOutstanding.map((r: any) => (
                      <tr key={r.resident_id} className="hover:bg-red-50/30 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-gray-900">{r.full_name}</td>
                        <td className="py-2.5 px-3.5 font-mono text-gray-500">{r.registration_number}</td>
                        <td className="py-2.5 px-3.5 text-gray-700">Room {r.room_number || '—'} · Bed {r.bed_label || '—'}</td>
                        <td className="py-2.5 px-3.5 text-gray-700 font-mono">{r.phone}</td>
                        <td className="py-2.5 px-3.5 text-right font-black text-red-600 text-sm">
                          {formatCurrency(r.total_outstanding_paise)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-emerald-700 text-xs bg-emerald-50/30 font-bold">
                        {searchQuery ? `No outstanding dues matching "${searchQuery}"` : '🎉 All resident accounts are in good standing! Zero outstanding dues.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. EXPENSE AUDIT TAB */}
        {activeTab === 'expenses' && (
          <div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
              {filteredExpenses && filteredExpenses.length > 0 ? (
                filteredExpenses.map((e: any) => (
                  <div key={e.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="capitalize font-bold text-xs text-gray-900 block">{e.category?.replace('_', ' ')}</span>
                        <p className="text-xs text-gray-600">{e.description}</p>
                      </div>
                      <span className="text-base font-black text-red-600">{formatCurrency(e.amount_paise)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <span className="text-[11px] text-gray-600">{e.vendor || 'General Vendor'}</span>
                      <span className="text-[10px] text-gray-400">{formatDate(e.expense_date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                  {searchQuery ? `No expenses matching "${searchQuery}"` : 'No expenses logged.'}
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/80 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5 font-bold">Date</th>
                    <th className="py-3 px-3.5 font-bold">Category</th>
                    <th className="py-3 px-3.5 font-bold">Description</th>
                    <th className="py-3 px-3.5 font-bold">Vendor / Payee</th>
                    <th className="py-3 px-3.5 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredExpenses && filteredExpenses.length > 0 ? (
                    filteredExpenses.map((e: any) => (
                      <tr key={e.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 text-gray-600">{formatDate(e.expense_date)}</td>
                        <td className="py-2.5 px-3.5 capitalize font-bold text-gray-800">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px]">{e.category?.replace('_', ' ')}</span>
                        </td>
                        <td className="py-2.5 px-3.5 font-semibold text-gray-900">{e.description}</td>
                        <td className="py-2.5 px-3.5 text-gray-700">{e.vendor || '—'}</td>
                        <td className="py-2.5 px-3.5 text-right font-black text-red-600 text-sm">
                          {formatCurrency(e.amount_paise)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 text-xs">
                        {searchQuery ? `No expenses matching "${searchQuery}"` : 'No expenses logged yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. OCCUPANCY LOG TAB */}
        {activeTab === 'occupancy' && (
          <div>
            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
              {filteredOccupancy && filteredOccupancy.length > 0 ? (
                filteredOccupancy.map((r: any) => (
                  <div key={r.resident_id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900">{r.full_name}</h3>
                        <p className="text-[11px] text-gray-500">Room {r.room_number || '—'} · Bed {r.bed_label || '—'}</p>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                          r.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <span className="text-[11px] font-bold text-gray-900">
                        {r.monthly_rent_paise ? formatCurrency(r.monthly_rent_paise) : '—'} / mo
                      </span>
                      <span className="text-[10px] text-gray-500">Since {formatDate(r.check_in_date)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
                  {searchQuery ? `No residents matching "${searchQuery}"` : 'No residents in registry.'}
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 bg-gray-50/80 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3.5 font-bold">Resident</th>
                    <th className="py-3 px-3.5 font-bold">Registration #</th>
                    <th className="py-3 px-3.5 font-bold">Room / Bed</th>
                    <th className="py-3 px-3.5 font-bold">Monthly Rent</th>
                    <th className="py-3 px-3.5 font-bold">Check-in Date</th>
                    <th className="py-3 px-3.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredOccupancy && filteredOccupancy.length > 0 ? (
                    filteredOccupancy.map((r: any) => (
                      <tr key={r.resident_id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 font-bold text-gray-900">{r.full_name}</td>
                        <td className="py-2.5 px-3.5 font-mono text-gray-500">{r.registration_number}</td>
                        <td className="py-2.5 px-3.5 text-gray-700">Room {r.room_number || '—'} · Bed {r.bed_label || '—'}</td>
                        <td className="py-2.5 px-3.5 font-bold text-gray-900">
                          {r.monthly_rent_paise ? formatCurrency(r.monthly_rent_paise) : '—'}
                        </td>
                        <td className="py-2.5 px-3.5 text-gray-600">{formatDate(r.check_in_date)}</td>
                        <td className="py-2.5 px-3.5">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                              r.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                        {searchQuery ? `No residents matching "${searchQuery}"` : 'No occupancy records.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
