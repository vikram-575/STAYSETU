'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Building2, Shield, Users, Sparkles, CheckCircle2, Loader2,
  AlertTriangle, User, Lock, Save, LogOut, Plus, QrCode,
  Phone, Mail, MapPin, Building, ShieldCheck, BadgeCheck,
  FileText, ExternalLink, ArrowUpRight, Check, Smartphone,
  Receipt, Eye, Share2, Copy, Sparkle, Globe, CreditCard
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
  const [previewMode, setPreviewMode] = useState<'invoice' | 'marketplace'>('invoice')
  const [copiedLink, setCopiedLink] = useState(false)

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
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        if (data.user) {
          setUserProfile({
            id: data.user.id,
            full_name: data.user.full_name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            role: data.user.role || 'owner',
          })

          if (data.organization) {
            setOrg({
              id: data.organization.id,
              name: data.organization.name || '',
              phone: data.organization.phone || data.user.phone || '',
              email: (() => {
                const raw = data.organization.email || data.user.email || ''
                if (
                  raw.includes('@owner.pgsetu.') ||
                  raw.includes('@user.pgsetu.') ||
                  raw.includes('@resident.pgsetu.') ||
                  raw.includes('@pgsetu.online') ||
                  raw.includes('@pgsetu.local') ||
                  (raw.includes('@pgsetu.com') && !raw.includes('contact@') && !raw.includes('support@'))
                ) {
                  return ''
                }
                return raw
              })(),
              address: data.organization.address || '',
              city: data.organization.city || '',
              state: data.organization.state || '',
              gst_enabled: !!data.organization.gst_enabled,
              gstin: data.organization.gstin || '',
              upi_id: (data.organization.settings as any)?.upi_id || '',
            })
          }
        }

        if (data.staffUsers) {
          setStaffUsers(data.staffUsers)
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

      // Also update user's full name if provided
      if (userProfile.id && userProfile.full_name) {
        await supabase
          .from('users')
          .update({ full_name: userProfile.full_name })
          .eq('id', userProfile.id)
      }

      setSuccess('PG Owner profile & direct settlement settings saved successfully!')
      setTimeout(() => setSuccess(''), 4000)
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

  const handleCopyHostLink = () => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/my-profile`
      navigator.clipboard.writeText(link)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  // Smart display computations for sanitized labels
  const isNumericOrgName = /^\d{10}$/.test(org.name || '')
  const displayOrgName = org.name && !isNumericOrgName ? org.name : 'PG Host Residence'
  const hostInitials = userProfile.full_name && !/^\d{10}$/.test(userProfile.full_name)
    ? userProfile.full_name.charAt(0).toUpperCase()
    : (displayOrgName ? displayOrgName.charAt(0).toUpperCase() : 'H')

  const displayHostName = userProfile.full_name && !/^\d{10}$/.test(userProfile.full_name)
    ? userProfile.full_name
    : (userProfile.phone ? `Host (+91 ${userProfile.phone.slice(-10)})` : 'Verified PG Host')

  const isSynthetic = !userProfile.email ||
    userProfile.email.includes('@pgsetu.') ||
    userProfile.email.includes('@owner.pgsetu.') ||
    userProfile.email.includes('@user.pgsetu.') ||
    userProfile.email.includes('@resident.pgsetu.')
  const displayIdentifier = isSynthetic
    ? (userProfile.phone ? `+91 ${userProfile.phone.slice(-10)}` : 'Host Account')
    : userProfile.email

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-sm text-gray-500 gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <span className="font-semibold text-gray-600">Loading Business Profile...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 px-3 sm:px-4">
      
      {/* 1. EXECUTIVE EMERALD HOST HERO CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 border border-emerald-800/40">
        {/* Subtle decorative glow circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Host Avatar with Verified Badge */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 backdrop-blur-md border border-emerald-400/30 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-inner shrink-0">
                {hostInitials}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-md ring-2 ring-slate-950" title="Verified Host">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {displayHostName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Verified PG Owner & Host
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-white">{displayOrgName}</span>
                {org.city && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      {org.city}{org.state ? `, ${org.state}` : ''}
                    </span>
                  </>
                )}
              </p>

              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 font-mono flex-wrap">
                <span>{displayIdentifier}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  0% Direct UPI Settlement
                </span>
                {org.upi_id && (
                  <span className="text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                    VPA: {org.upi_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
            <button
              type="button"
              onClick={handleCopyHostLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition active:scale-95 shadow-xs cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Host Pass'}</span>
            </button>
            <a
              href="/my-profile"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-400/30 px-3.5 py-2 text-xs font-bold text-emerald-200 transition active:scale-95 shadow-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Public Profile</span>
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 px-3.5 py-2 text-xs font-bold text-rose-100 transition active:scale-95 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={cn(
            'px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95',
            activeTab === 'profile'
              ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/10'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>PG Business Profile & UPI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={cn(
            'px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95',
            activeTab === 'account'
              ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/10'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <User className="w-3.5 h-3.5" />
          <span>Account & Security</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={cn(
            'px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95',
            activeTab === 'staff'
              ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/10'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff & Caretakers ({staffUsers.length})</span>
        </button>
      </div>

      {/* NOTIFICATIONS & ALERTS */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-bold flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: PG BUSINESS PROFILE & SETTLEMENTS (2-COLUMN EXECUTIVE VIEW) */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* Helper Banner if phone number is the name */}
          {isNumericOrgName && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 flex items-start gap-3 text-xs text-amber-900 shadow-xs">
              <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Upgrade to Your Real PG Brand Name</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Your business name currently shows as your phone number (<code className="font-bold">{org.name}</code>). 
                  Please enter your real PG brand name below (e.g. &ldquo;Sai Executive Co-Living&rdquo;) so it prints properly on all tenant rent receipts and your marketplace listing.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: THE SETTINGS FORM (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* CARD 1: Brand & Property Identity */}
              <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900">
                      Brand & Host Identity
                    </h2>
                    <p className="text-xs text-gray-500">
                      Printed on tenant passbooks, monthly invoices, and rent receipts
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                      PG Business / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sai Executive Luxury PG & Co-Living"
                      value={org.name || ''}
                      onChange={(e) => setOrg({ ...org, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none font-bold text-gray-900 transition"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Appears as the prominent header across all guest statements and receipts
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                      Host / Owner Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Sharma"
                      value={userProfile.full_name || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, full_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none font-bold text-gray-900 transition"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      Authorised signatory for resident KYC verification and legal agreements
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD 2: Direct UPI Settlement */}
              <div className="bg-white rounded-3xl border border-emerald-300/80 p-5 sm:p-6 shadow-xs space-y-4 ring-1 ring-emerald-500/10">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-gray-900">
                        Direct UPI Rent Settlement (0% Commission)
                      </h2>
                      <p className="text-xs text-gray-500">
                        Tenants pay directly to your personal or merchant bank VPA
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Direct to Bank
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Owner UPI ID / VPA Handle *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@upi"
                      value={org.upi_id || ''}
                      onChange={(e) => setOrg({ ...org, upi_id: e.target.value })}
                      className="w-full pl-3.5 pr-12 py-2.5 text-xs sm:text-sm bg-emerald-50/40 border border-emerald-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none font-mono font-bold text-emerald-950 transition"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <QrCode className="h-4 w-4 text-emerald-700" />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    When a tenant clicks &ldquo;Pay Rent&rdquo; or scans their invoice QR code, funds land straight in your linked bank account. No intermediate holding or withdrawal fees.
                  </p>
                </div>
              </div>

              {/* CARD 3: Official Contact & Address */}
              <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900">
                      Official Contact & Property Location
                    </h2>
                    <p className="text-xs text-gray-500">
                      Used for prospective tenant inquiries and Google Maps navigation
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-600" />
                      <span>Official Phone *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={org.phone || ''}
                      onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold text-gray-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Mail className="h-3 w-3 text-emerald-600" />
                      <span>Support / Billing Email</span>
                    </label>
                    <input
                      type="email"
                      placeholder="contact@saipg.com"
                      value={org.email || ''}
                      onChange={(e) => setOrg({ ...org, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold text-gray-900 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                      City / Area Hub *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru / Noida / Pune"
                      value={org.city || ''}
                      onChange={(e) => setOrg({ ...org, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold text-gray-900 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                      State / UT
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Karnataka / Uttar Pradesh"
                      value={org.state || ''}
                      onChange={(e) => setOrg({ ...org, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-bold text-gray-900 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Full Street Address & Landmark
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Building 12, 4th Cross, Near Metro Station, Sector 62"
                    value={org.address || ''}
                    onChange={(e) => setOrg({ ...org, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-50/80 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-600 outline-none font-medium text-gray-900 transition"
                  />
                </div>
              </div>

              {/* CARD 4: GST & Commercial Tax Invoicing */}
              <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-gray-900">
                        GST Tax Invoicing & Legal Entity
                      </h2>
                      <p className="text-xs text-gray-500">
                        Include GSTIN on tax invoices for corporate and commercial tenants
                      </p>
                    </div>
                  </div>
                  
                  {/* Toggle switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!org.gst_enabled}
                      onChange={(e) => setOrg({ ...org, gst_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>

                {org.gst_enabled && (
                  <div className="pt-2 animate-in fade-in space-y-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      GSTIN Registration Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      value={org.gstin || ''}
                      onChange={(e) => setOrg({ ...org, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl bg-gray-50 font-mono uppercase font-bold text-gray-900 tracking-wider focus:bg-white focus:border-emerald-600 outline-none"
                    />
                    <span className="text-[10px] text-gray-400 block">
                      15-digit Goods and Services Tax Identification Number
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE GUEST PREVIEW (5 Cols, Sticky) */}
            <div className="lg:col-span-5 sticky top-6 space-y-4">
              
              {/* Preview Mode Switcher */}
              <div className="bg-slate-900 text-white rounded-2xl p-1.5 flex items-center gap-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewMode('invoice')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer',
                    previewMode === 'invoice'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Tenant Receipt Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('marketplace')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer',
                    previewMode === 'marketplace'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Listing Card Preview</span>
                </button>
              </div>

              {/* PREVIEW CONTAINER */}
              {previewMode === 'invoice' ? (
                /* LIVE INVOICE PREVIEW */
                <div className="bg-white rounded-3xl border-2 border-emerald-200/90 p-5 shadow-lg shadow-emerald-950/5 space-y-4 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] pb-3 border-b border-gray-100">
                    <span className="font-mono text-gray-400 uppercase tracking-wider">OFFICIAL TAX RECEIPT</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                      <BadgeCheck className="w-3 h-3 text-emerald-600" />
                      Live Sync
                    </span>
                  </div>

                  {/* Header with PG Brand Name */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white font-black text-sm flex items-center justify-center shrink-0">
                        {hostInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-sm text-gray-900 truncate">
                          {displayOrgName}
                        </h3>
                        <p className="text-[10px] text-gray-500 truncate">
                          {org.address || 'Address configured above'}
                          {org.city ? `, ${org.city}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sample Bill Details */}
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-gray-500 text-[11px]">
                      <span>Invoice: #INV-2026-SEP</span>
                      <span>Date: 27 Sep 2026</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-gray-200/60 font-semibold text-gray-800">
                      <span>Resident: Rahul Verma (Rm 102)</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">Paid</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-gray-600">Monthly Accommodation</span>
                      <span className="font-mono font-bold text-gray-900 text-sm">₹8,500.00</span>
                    </div>
                    {org.gst_enabled && org.gstin && (
                      <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1 border-t border-gray-200/40">
                        <span>GSTIN: {org.gstin}</span>
                        <span>18% Tax Compliant</span>
                      </div>
                    )}
                  </div>

                  {/* UPI QR & Payment Box */}
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-2xl border border-emerald-300 text-center space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                      Direct UPI Instant Payment Destination
                    </span>
                    <div className="inline-block p-2 bg-white rounded-xl border border-emerald-300 shadow-xs">
                      <QrCode className="w-24 h-24 text-emerald-950 mx-auto" />
                    </div>
                    <div className="font-mono text-xs font-black text-emerald-900 bg-white/80 py-1 px-3 rounded-lg border border-emerald-200 inline-block">
                      {org.upi_id || 'your-upi-id@bank'}
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium">
                      ✓ Instant 0% gateway fee credit directly to your bank account
                    </p>
                  </div>

                  {/* Footer contact */}
                  <div className="pt-2 text-center text-[10px] text-gray-400 space-y-0.5">
                    <p>Host: {displayHostName} • Tel: {org.phone || '+91 98765 43210'}</p>
                    <p className="text-emerald-700 font-semibold">Verified Electronic Rent Receipt • Digital Tax Invoice</p>
                  </div>
                </div>
              ) : (
                /* LIVE MARKETPLACE CARD PREVIEW */
                <div className="bg-white rounded-3xl border-2 border-emerald-200/90 overflow-hidden shadow-lg shadow-emerald-950/5 space-y-3">
                  <div className="h-32 bg-gradient-to-r from-emerald-900 to-slate-900 p-4 flex flex-col justify-between text-white relative">
                    <div className="flex justify-between items-start">
                      <span className="bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                        Verified PG
                      </span>
                      <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {org.city || 'City'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-base truncate">{displayOrgName}</h4>
                      <p className="text-[11px] text-emerald-200/90 truncate">{org.address || 'Location'}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Host</span>
                      <span className="font-bold text-gray-900">{displayHostName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Instant Contact</span>
                      <span className="font-mono text-emerald-700 font-bold">{org.phone || '+91 98765 43210'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Payment Support</span>
                      <span className="text-emerald-700 font-semibold">0% Fee Direct UPI</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-bold">Direct Booking Available</span>
                      <span className="px-3 py-1 bg-emerald-800 text-white rounded-lg font-bold text-[11px]">
                        View PG
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Informative Security Callout */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 text-xs space-y-1.5 border border-slate-800">
                <div className="flex items-center gap-1.5 text-white font-bold text-xs">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>White-Label Security Guarantee</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your tenants see only your verified business branding, direct UPI payment coordinates, and contact details across passbooks, receipts, and portal statements.
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Action Strip */}
          <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Settings update live across resident invoices, ledger, and guest portals</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-emerald-800 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile & Billing Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: USER ACCOUNT & PASSWORD */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'account' && (
        <form onSubmit={handleUpdatePassword} className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-5 max-w-2xl">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Personal Account & Credentials</h2>
              <p className="text-xs text-gray-500">Manage security settings and change your login password</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                disabled
                value={userProfile.full_name || 'PG Owner'}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-600 font-bold cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Account ID / Identifier
              </label>
              <input
                type="text"
                disabled
                value={displayIdentifier}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-600 font-mono font-bold cursor-not-allowed"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-emerald-900 block uppercase tracking-wider">
              Change Login Password
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:border-emerald-600 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-gray-200 rounded-xl focus:border-emerald-600 outline-none font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading || !newPassword}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900">Staff & Caretaker Access</h2>
                <p className="text-xs text-gray-500">Grant property managers, caretakers, and accountants restricted access</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAddStaffModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Staff Member</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-3.5">Staff Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Assigned Role</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {staffUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/70 transition">
                    <td className="p-3.5 font-bold text-gray-900">{u.full_name || 'Staff User'}</td>
                    <td className="p-3.5 text-gray-600">{u.email}</td>
                    <td className="p-3.5 text-gray-500">{u.phone || '—'}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        <Check className="h-3 w-3" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {staffUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No additional staff members added yet. Click &ldquo;+ Add Staff Member&rdquo; to add caretakers or accountants.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Staff Member */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-base font-black text-gray-900">Add Staff Member</h3>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Caretaker"
                  value={staffForm.full_name}
                  onChange={(e) => setStaffForm({ ...staffForm, full_name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="staff@pg.com"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Role</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none focus:border-emerald-600"
                >
                  <option value="manager">Property Manager</option>
                  <option value="accountant">Accountant</option>
                  <option value="staff">Staff / Caretaker</option>
                </select>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
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
