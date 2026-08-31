'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Settings, Building2, Shield, Users, DollarSign,
  Sparkles, CheckCircle2, Loader2, Database, AlertTriangle,
  User, Lock, Save, Trash2, Download, LogOut, Plus, QrCode,
  Check, Phone, Mail, MapPin, Building
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'staff'>('profile')

  // User Profile
  const [userProfile, setUserProfile] = useState<any>({
    id: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'owner',
  })

  // Organization Data
  const [org, setOrg] = useState<any>({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gst_enabled: false,
    gstin: '',
    upi_id: '',
  })

  // Password Update
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Staff list
  const [staffUsers, setStaffUsers] = useState<any[]>([])
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [staffForm, setStaffForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'manager',
  })
  const [staffLoading, setStaffLoading] = useState(false)

  // Load Organization & User Profile
  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*, organizations(*)')
            .eq('id', user.id)
            .single()

          if (profile) {
            setUserProfile({
              id: profile.id,
              full_name: profile.full_name || '',
              email: profile.email || user.email || '',
              phone: profile.phone || '',
              role: profile.role || 'owner',
            })

            if (profile.organizations) {
              setOrg({
                id: profile.organizations.id,
                name: profile.organizations.name || '',
                phone: profile.organizations.phone || '',
                email: profile.organizations.email || '',
                address: profile.organizations.address || '',
                city: profile.organizations.city || '',
                state: profile.organizations.state || '',
                gst_enabled: !!profile.organizations.gst_enabled,
                gstin: profile.organizations.gstin || '',
                upi_id: (profile.organizations.settings as any)?.upi_id || '',
              })
            }
          }
        }

        // Fetch staff users
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        if (users) {
          setStaffUsers(users)
        }
      } catch (err: any) {
        console.error('Failed to load profile settings', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [supabase])

  // Save Business Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (org.id) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({
            name: org.name,
            phone: org.phone || null,
            email: org.email || null,
            address: org.address || null,
            city: org.city || null,
            state: org.state || null,
            gst_enabled: org.gst_enabled,
            gstin: org.gstin || null,
            settings: {
              upi_id: org.upi_id || undefined,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', org.id)

        if (updateError) throw updateError
      }

      setSuccess('Organization profile and billing settings saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Update Account Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setPasswordLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword })
      if (pwdError) throw pwdError
      setSuccess('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Create Staff User
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setStaffLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...staffForm,
          organization_id: org.id || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create staff account')

      setSuccess(`Staff account for ${staffForm.email} created!`)
      setShowAddStaffModal(false)
      setStaffForm({ full_name: '', email: '', password: '', phone: '', role: 'manager' })

      // Reload staff
      const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      if (users) setStaffUsers(users)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setStaffLoading(false)
    }
  }


  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await supabase.auth.signOut()
    } catch {}
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-600" /> Loading profile settings...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-20">
      
      {/* 1. Executive Profile Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            {userProfile.full_name?.charAt(0)?.toUpperCase() || userProfile.email?.charAt(0)?.toUpperCase() || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight tracking-tight">
                {userProfile.full_name || 'PG Owner Profile'}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200/60 uppercase">
                {userProfile.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{userProfile.email}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              🏢 {org.name || 'PG-SETU Accommodation'}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 w-max">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-95',
              activeTab === 'profile' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Building2 className="w-3.5 h-3.5" /> PG Profile & GST
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-95',
              activeTab === 'account' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <User className="w-3.5 h-3.5" /> Account & Password
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap active:scale-95',
              activeTab === 'staff' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Users className="w-3.5 h-3.5" /> Staff & Roles ({staffUsers.length})
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: PG BUSINESS PROFILE & GST */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Organization & Property Profile</h2>
              <p className="text-xs text-slate-500">Business identity shown on invoices, receipts & tenant passbooks</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PG Business / Property Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sai Executive PG"
                value={org.name || ''}
                onChange={(e) => setOrg({ ...org, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Contact Phone</label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={org.phone || ''}
                onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Official Billing Email</label>
              <input
                type="email"
                placeholder="e.g. contact@saipg.com"
                value={org.email || ''}
                onChange={(e) => setOrg({ ...org, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID (For Instant Tenant Rent QR)</label>
              <input
                type="text"
                placeholder="e.g. saiexecutive@upi"
                value={org.upi_id || ''}
                onChange={(e) => setOrg({ ...org, upi_id: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City / Location</label>
              <input
                type="text"
                placeholder="e.g. Pune"
                value={org.city || ''}
                onChange={(e) => setOrg({ ...org, city: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
              <input
                type="text"
                placeholder="e.g. Maharashtra"
                value={org.state || ''}
                onChange={(e) => setOrg({ ...org, state: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Property Address</label>
            <textarea
              rows={2}
              placeholder="Enter building number, street, area and landmark"
              value={org.address || ''}
              onChange={(e) => setOrg({ ...org, address: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-900"
            />
          </div>

          {/* GST Configuration */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">GST / Tax Invoicing (Optional)</span>
                <span className="text-[11px] text-slate-500">Calculate 18% GST on room and commercial invoices</span>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={org.gstin || ''}
                  onChange={(e) => setOrg({ ...org, gstin: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-mono uppercase font-bold"
                />
              </div>
            )}
          </div>

          {/* Bottom Action Strip */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">All changes apply in real-time across invoices & tenant portal</p>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: USER ACCOUNT & PASSWORD */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'account' && (
        <form onSubmit={handleUpdatePassword} className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Personal Account & Security</h2>
            <p className="text-xs text-slate-500">Update your login password and security settings</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={userProfile.full_name || 'PG Owner'}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Login Email</label>
              <input
                type="email"
                disabled
                value={userProfile.email}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold cursor-not-allowed"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-800 block">Change Password</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading || !newPassword}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              {passwordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: STAFF & USER MANAGEMENT */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Staff & Team Permissions</h2>
              <p className="text-xs text-slate-500">Manage property managers, caretakers, and accountants</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddStaffModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Staff Member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {staffUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900">{u.full_name || 'Staff User'}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3 text-slate-500">{u.phone || '—'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* Modal: Add Staff Member */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-base font-black text-slate-900">Add Staff Account</h3>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Caretaker"
                  value={staffForm.full_name}
                  onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="staff@pg.com"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="manager">Property Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="staff">Staff / Caretaker</option>
                </select>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  {staffLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
