import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/money'
import { cn, formatDate } from '@/lib/utils'
import {
  DollarSign, Plus, Zap, Users, Wrench, Utensils,
  Home, ShoppingBag, ShieldCheck, Filter
} from 'lucide-react'

interface Props {
  searchParams: Promise<{
    category?: string
  }>
}

export default async function ExpensesPage({ searchParams }: Props) {
  const params = await searchParams
  const selectedCat = params.category || 'all'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  const orgId = profile.organization_id

  // Month stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  let query = supabase
    .from('expenses')
    .select('*')
    .eq('organization_id', orgId)
    .order('expense_date', { ascending: false })

  if (selectedCat !== 'all') {
    query = query.eq('category', selectedCat)
  }

  const { data: expenses } = await query

  const totalExpensePaise = expenses?.reduce((s, e) => s + e.amount_paise, 0) || 0

  // Category map icons
  const catIcons: Record<string, any> = {
    electricity: Zap,
    staff_salary: Users,
    maintenance: Wrench,
    food_procurement: Utensils,
    property_rent: Home,
    cleaning: ShoppingBag,
    supplies: ShoppingBag,
    other: DollarSign,
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Expense & Operating Cost Center</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Track PG operational expenditures (Staff, Utilities, Groceries, Maintenance)
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/expenses/new"
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" /> Record New Expense
          </Link>
        </div>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-red-200 shadow-2xs bg-red-50/20">
          <p className="text-[10px] uppercase font-bold text-red-600 truncate">Total Expenses</p>
          <p className="text-lg sm:text-xl font-black text-red-800 mt-0.5 truncate">{formatCurrency(totalExpensePaise)}</p>
          <p className="text-[10px] text-red-500 font-medium">{expenses?.length || 0} entries</p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-500 truncate">Electricity & Utilities</p>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-0.5 truncate">
            {formatCurrency(expenses?.filter((e) => e.category === 'electricity' || e.category === 'water').reduce((s, e) => s + e.amount_paise, 0) || 0)}
          </p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-500 truncate">Staff & Caretaker</p>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-0.5 truncate">
            {formatCurrency(expenses?.filter((e) => e.category === 'staff_salary').reduce((s, e) => s + e.amount_paise, 0) || 0)}
          </p>
        </div>
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 shadow-2xs">
          <p className="text-[10px] uppercase font-bold text-gray-500 truncate">Groceries & Mess</p>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-0.5 truncate">
            {formatCurrency(expenses?.filter((e) => e.category === 'food_procurement').reduce((s, e) => s + e.amount_paise, 0) || 0)}
          </p>
        </div>
      </div>

      {/* Category Filter with horizontal scrolling */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold w-max">
          {['all', 'electricity', 'staff_salary', 'food_procurement', 'maintenance', 'property_rent', 'cleaning', 'other'].map((cat) => (
            <Link
              key={cat}
              href={`/dashboard/expenses?category=${cat}`}
              className={cn(
                'px-3 py-1.5 rounded-lg transition capitalize whitespace-nowrap',
                selectedCat === cat ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {cat.replace('_', ' ')}
            </Link>
          ))}
        </div>
      </div>

      {/* Expenses Container */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-gray-900">Recorded Expenses Log</h2>

        {/* 1. Mobile Cards View */}
        <div className="block md:hidden space-y-2.5">
          {expenses && expenses.length > 0 ? (
            expenses.map((e) => {
              const Icon = catIcons[e.category] || DollarSign
              return (
                <div key={e.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="capitalize font-bold text-xs text-gray-900 block">{e.category.replace('_', ' ')}</span>
                        <p className="text-xs text-gray-600 font-medium">{e.description}</p>
                      </div>
                    </div>
                    <span className="text-base font-black text-red-600 shrink-0">{formatCurrency(e.amount_paise)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <span className="text-[11px] text-gray-600 truncate">{e.vendor || 'General Vendor'}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">
                        {e.payment_method || 'CASH'}
                      </span>
                      <span className="text-[10px] text-gray-400">{formatDate(e.expense_date)}</span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-200">
              No expense records found.
            </div>
          )}
        </div>

        {/* 2. Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 bg-gray-50 uppercase">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Vendor / Payee</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {expenses && expenses.length > 0 ? (
                expenses.map((e) => {
                  const Icon = catIcons[e.category] || DollarSign
                  return (
                    <tr key={e.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="py-3 px-3 text-gray-700">{formatDate(e.expense_date)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-gray-500" />
                          <span className="capitalize font-bold text-gray-800">{e.category.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-900">{e.description}</td>
                      <td className="py-3 px-3 text-gray-700">{e.vendor || '—'}</td>
                      <td className="py-3 px-3 uppercase text-gray-600 font-mono text-[11px]">{e.payment_method || 'CASH'}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-red-600 text-sm">
                        {formatCurrency(e.amount_paise)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
