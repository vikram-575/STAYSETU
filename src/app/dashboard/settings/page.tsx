'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Settings, Building2, Shield, Users, DollarSign,
  Sparkles, CheckCircle2, Loader2, Database, AlertTriangle
} from 'lucide-react'

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState('')
  const [error, setError] = useState('')

  const [activeTab, setActiveTab] = useState<'profile' | 'catalog' | 'dev'>('profile')

  const [org, setOrg] = useState<any>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gst_enabled: false,
    gstin: '',
  })

  useEffect(() => {
    async function loadOrg() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single()

      if (profile?.organizations) {
        setOrg(profile.organizations)
      }
      setLoading(false)
    }
    loadOrg()
  }, [supabase])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        name: org.name,
        phone: org.phone,
        email: org.email,
        address: org.address,
        city: org.city,
        state: org.state,
        gst_enabled: org.gst_enabled,
        gstin: org.gstin,
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id)

    setSaving(false)
    if (updateError) setError(updateError.message)
    else alert('Organization settings updated successfully!')
  }

  const handleSeedDemoData = async () => {
    if (!confirm('This will populate sample buildings, rooms, beds, residents, invoices, and payments for testing. Proceed?')) {
      return
    }

    setSeeding(true)
    setSeedSuccess('')
    setError('')

    try {
      const res = await fetch('/api/dev/seed', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to seed demo data')

      setSeedSuccess('Demo data populated successfully! Refresh or visit Dashboard to see live metrics.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading settings...
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">System Settings & Configuration</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Organization profile · Billing & GST preferences · Test seed data
        </p>
      </div>

      {/* Tabs with horizontal scroll */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold w-max">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            PG Profile & GST
          </button>
          <button
            onClick={() => setActiveTab('dev')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dev' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Demo Seed Data
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Profile Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Organization Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">PG Organization Name *</label>
              <input
                type="text"
                required
                value={org.name || ''}
                onChange={(e) => setOrg({ ...org, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Official Mobile Phone</label>
              <input
                type="tel"
                value={org.phone || ''}
                onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Official Email</label>
              <input
                type="email"
                value={org.email || ''}
                onChange={(e) => setOrg({ ...org, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">City / Location</label>
              <input
                type="text"
                value={org.city || ''}
                onChange={(e) => setOrg({ ...org, city: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Full Property Address</label>
            <textarea
              rows={2}
              value={org.address || ''}
              onChange={(e) => setOrg({ ...org, address: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* GST Configuration (Optional) */}
          <div className="p-3.5 sm:p-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900 block">GST / Tax Invoicing (Optional)</span>
                <span className="text-[11px] text-gray-500">Enable GST tax calculations on bills & invoices</span>
              </div>
              <input
                type="checkbox"
                checked={!!org.gst_enabled}
                onChange={(e) => setOrg({ ...org, gst_enabled: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {org.gst_enabled && (
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={org.gstin || ''}
                  onChange={(e) => setOrg({ ...org, gstin: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white font-mono uppercase font-bold"
                />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Demo Seed Tab */}
      {activeTab === 'dev' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Database className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Developer Demo Data Seeder</h2>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Populate realistic PG data for testing (Rooms, Beds, Active Residents, Invoices, Payments, Electricity).
              </p>
            </div>
          </div>

          {seedSuccess && (
            <div className="p-3.5 sm:p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              {seedSuccess}
            </div>
          )}

          <div className="p-3.5 sm:p-4 bg-blue-50/50 border border-blue-200 rounded-xl sm:rounded-2xl space-y-2 text-xs text-blue-900">
            <p className="font-bold">What will be generated:</p>
            <ul className="list-disc pl-5 space-y-1 text-[11px] sm:text-xs">
              <li>1 Property (&quot;Main Campus PG&quot;) with 2 Buildings & 3 Floors</li>
              <li>10 Rooms with 30 Beds (Single, Double, Triple sharing)</li>
              <li>15 Active Residents with Permanent Registration IDs (PG-2026-XXXXXX)</li>
              <li>Monthly Invoices with Rent, Electricity, Food, and Laundry items</li>
              <li>Payment collections via UPI, Cash, and Bank Transfer</li>
              <li>Sub-meters and live electricity consumption readings</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedDemoData}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {seeding ? 'Generating Sample PG Data...' : 'Seed Sample PG Data'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
