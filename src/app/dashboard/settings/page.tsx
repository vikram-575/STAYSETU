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

  const [activeTab, setActiveTab] = useState<'profile' | 'catalog' | 'data'>('profile')

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
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*, organizations(*)')
            .eq('id', user.id)
            .single()

          if (profile?.organizations) {
            setOrg(profile.organizations)
            setLoading(false)
            return
          }
        }

        // Fallback fetch from organizations endpoint
        const res = await fetch('/api/admin/organizations')
        const data = await res.json()
        if (data?.organizations && data.organizations.length > 0) {
          setOrg(data.organizations[0])
        }
      } catch {}
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
            onClick={() => setActiveTab('data')}
            className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'data' ? 'bg-white text-red-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Data & Production Clean
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

      {/* Data Management & Purge Tab */}
      {activeTab === 'data' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Database className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Data Management & Production Reset</h2>
              <p className="text-[11px] sm:text-xs text-gray-500">
                Purge mock/test transactions or reset your organization to clean production mode.
              </p>
            </div>
          </div>

          {seedSuccess && (
            <div className="p-3.5 sm:p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              {seedSuccess}
            </div>
          )}

          <div className="p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl space-y-2 text-xs text-red-950">
            <p className="font-black text-red-700">⚠️ Production Launch & Data Purge Options</p>
            <p className="text-red-800 text-[11px] sm:text-xs">
              When transitioning to live production, you can wipe test records so you start with 0 residents, 0 dummy invoices, and accurate financial reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 border border-gray-200 rounded-xl space-y-2">
              <h3 className="font-bold text-xs text-gray-900">1. Purge Test Transactions & Residents</h3>
              <p className="text-[11px] text-gray-500">
                Wipes all test residents, invoices, payments, and ledger logs. Keeps your rooms and beds intact and marks them 100% available for live check-ins.
              </p>
              <button
                type="button"
                disabled={seeding}
                onClick={async () => {
                  if (!confirm('Are you sure you want to purge all test residents, invoices, and payments? This cannot be undone.')) return
                  setSeeding(true)
                  setSeedSuccess('')
                  setError('')
                  try {
                    const res = await fetch('/api/admin/purge-data', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ wipe_all: false }),
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Failed to purge data')
                    setSeedSuccess(data.message)
                  } catch (err: any) {
                    setError(err.message)
                  } finally {
                    setSeeding(false)
                  }
                }}
                className="w-full mt-2 py-2.5 px-3 bg-red-600 hover:bg-red-700 active:scale-95 disabled:bg-red-300 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                {seeding ? 'Purging...' : 'Purge Test Transactions'}
              </button>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl space-y-2">
              <h3 className="font-bold text-xs text-gray-900">2. Complete Organization Reset</h3>
              <p className="text-[11px] text-gray-500">
                Wipes everything including properties, rooms, beds, and records, giving you a completely blank organization ready for custom onboarding.
              </p>
              <button
                type="button"
                disabled={seeding}
                onClick={async () => {
                  if (!confirm('WARNING: This will completely delete ALL properties, rooms, beds, residents, and financial records for this organization. Proceed?')) return
                  setSeeding(true)
                  setSeedSuccess('')
                  setError('')
                  try {
                    const res = await fetch('/api/admin/purge-data', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ wipe_all: true }),
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Failed to purge data')
                    setSeedSuccess(data.message)
                  } catch (err: any) {
                    setError(err.message)
                  } finally {
                    setSeeding(false)
                  }
                }}
                className="w-full mt-2 py-2.5 px-3 bg-gray-900 hover:bg-black active:scale-95 disabled:bg-gray-400 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                {seeding ? 'Resetting...' : 'Complete Reset to Blank'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
