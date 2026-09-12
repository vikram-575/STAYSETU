'use client'

import { useState, useEffect } from 'react'
import {
  Utensils, AlertTriangle, CheckCircle2, TrendingDown,
  ShoppingBag, Plus, RefreshCw, Calendar, DollarSign,
  Package, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'

export default function MessInventoryPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inventory' | 'attendance' | 'menu'>('inventory')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/erp/mess')
      const json = await res.json()
      if (res.ok) setData(json)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const lowStockItems = data?.groceries?.filter((g: any) => g.quantity <= g.minThreshold) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              FOOD OPERATIONS
            </span>
            <h1 className="text-xl font-black text-gray-900">Mess Inventory & Recipe Costing</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Track daily kitchen headcount, monitor grocery buffer stock, and calculate the exact cost per meal served.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Today&apos;s Cost Per Meal</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {formatCurrency(data?.summary?.todayCostPerMealPaise || 0)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Healthy target &lt; ₹45/meal</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Meals Served Today</span>
          <p className="text-2xl font-black text-gray-900 mt-1">
            {data?.summary?.totalHeadcountToday || 0} Plates
          </p>
          <span className="text-[10px] text-gray-500 font-semibold">Breakfast + Lunch + Dinner</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Stock Items Monitored</span>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {data?.summary?.totalGroceryItems || 0} Ingredients
          </p>
          <span className="text-[10px] text-blue-600 font-semibold">Grains, Pulses, Dairy & Oils</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] text-rose-500 font-bold uppercase block">Reorder Needed</span>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {lowStockItems.length} Low Stock Alert{lowStockItems.length !== 1 ? 's' : ''}
          </p>
          <span className="text-[10px] text-rose-500 font-semibold">Below minimum buffer limit</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'inventory'
              ? 'bg-[#14532D] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Kitchen Stock Ledger ({data?.groceries?.length || 0} Items)
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'attendance'
              ? 'bg-[#14532D] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Daily Meal Headcount Log
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'menu'
              ? 'bg-[#14532D] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Weekly Digital Menu Board
        </button>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
        </div>
      ) : activeTab === 'inventory' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">In-Stock Quantity</th>
                  <th className="p-3">Reorder Threshold</th>
                  <th className="p-3">Estimated Unit Price</th>
                  <th className="p-3">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {data?.groceries?.map((g: any) => {
                  const isLow = g.quantity <= g.minThreshold
                  return (
                    <tr key={g.id} className="hover:bg-gray-50/60 transition">
                      <td className="p-3 font-bold text-gray-900">{g.name}</td>
                      <td className="p-3 text-gray-600">{g.category}</td>
                      <td className="p-3 font-mono font-black text-sm text-gray-900">
                        {g.quantity} {g.unit}
                      </td>
                      <td className="p-3 font-mono text-gray-500 text-xs">
                        {g.minThreshold} {g.unit}
                      </td>
                      <td className="p-3 text-gray-700">
                        {formatCurrency(g.unitPricePaise)} / {g.unit}
                      </td>
                      <td className="p-3">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> REORDER URGENT
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ✓ Healthy Buffer
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'attendance' ? (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Breakfast</th>
                  <th className="p-3">Lunch</th>
                  <th className="p-3">Dinner</th>
                  <th className="p-3">Total Meals</th>
                  <th className="p-3">Food Procurement Expense</th>
                  <th className="p-3">Calculated Cost / Meal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {data?.attendance?.map((att: any) => (
                  <tr key={att.date} className="hover:bg-gray-50/60 transition">
                    <td className="p-3 font-bold text-gray-900">{att.date}</td>
                    <td className="p-3 font-mono text-gray-700">{att.breakfastCount}</td>
                    <td className="p-3 font-mono text-gray-700">{att.lunchCount}</td>
                    <td className="p-3 font-mono text-gray-700">{att.dinnerCount}</td>
                    <td className="p-3 font-black text-gray-900">{att.totalMeals}</td>
                    <td className="p-3 font-semibold text-rose-700">{formatCurrency(att.totalExpensePaise)}</td>
                    <td className="p-3 font-black text-emerald-700 text-sm">
                      {formatCurrency(att.costPerMealPaise)} / meal
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Weekly Menu Board */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
            <span className="text-xs font-black uppercase text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
              Breakfast (7:30 - 10:00 AM)
            </span>
            <ul className="text-xs text-gray-600 space-y-1.5 font-medium">
              <li>• Mon: Poha with Peanuts & Mint Chutney</li>
              <li>• Tue: Idli, Vada with Sambar & Coconut Chutney</li>
              <li>• Wed: Aloo Paratha with Curd & Pickle</li>
              <li>• Thu: Masala Upma & Kesari Bath</li>
              <li>• Fri: Masala Dosa with Chutney</li>
              <li>• Sat: Puri Bhaji & Halwa</li>
              <li>• Sun: Chole Bhature Special</li>
            </ul>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
            <span className="text-xs font-black uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
              Lunch (12:30 - 2:30 PM)
            </span>
            <ul className="text-xs text-gray-600 space-y-1.5 font-medium">
              <li>• Phulka Rotis + Dal Tadka</li>
              <li>• Seasonal Veg Sabzi (Paneer / Bhindi / Gobi)</li>
              <li>• Steamed Jeera Rice & Rasam</li>
              <li>• Fresh Curd / Buttermilk & Salad</li>
              <li>• Sweet: Gulab Jamun on Wednesday</li>
            </ul>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
            <span className="text-xs font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
              Dinner (8:00 - 10:00 PM)
            </span>
            <ul className="text-xs text-gray-600 space-y-1.5 font-medium">
              <li>• Chapati with Dal Makhani / Mixed Veg</li>
              <li>• Special Veg Pulao / Biryani on Friday</li>
              <li>• Chicken Curry (Non-Veg Option) on Sundays</li>
              <li>• Paneer Butter Masala (Veg Option) on Sundays</li>
              <li>• Ice Cream / Kheer Dessert on Sunday</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
