'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, User, MapPin, Phone, Mail, Home, Users, Calendar,
  Star, Search, Loader2, ArrowLeft, RefreshCw, Edit, LogOut,
  CheckCircle2, Clock, Tag, Bed,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBudget, AMENITY_OPTIONS } from '@/lib/profiles'

function getAmenityLabel(val: string) {
  return AMENITY_OPTIONS.find(a => a.value === val)?.label || val
}

function ProfileDashboardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mobile, setMobile] = useState('')
  const [mobileInput, setMobileInput] = useState(searchParams.get('mobile') || '')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tenantLeads, setTenantLeads] = useState<any[]>([])
  const [loadingLeads, setLoadingLeads] = useState(false)

  // Auto-load from localStorage on mount
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('pgsetu_profile_id')
      const savedMobile = localStorage.getItem('pgsetu_profile_mobile')
      const savedData = localStorage.getItem('pgsetu_profile_data')
      if (savedMobile) {
        setMobileInput(savedMobile)
        setMobile(savedMobile)
      }
      if (savedData) {
        setProfile(JSON.parse(savedData))
      }
    } catch {}
  }, [])

  // Auto-lookup if mobile in URL
  useEffect(() => {
    const urlMobile = searchParams.get('mobile')
    if (urlMobile && urlMobile !== mobile) {
      setMobileInput(urlMobile)
      setMobile(urlMobile)
      lookupProfile(urlMobile)
    }
  }, [searchParams])

  const lookupProfile = async (mobileNum?: string) => {
    const lookupMobile = (mobileNum || mobileInput).replace(/\D/g, '')
    if (!lookupMobile || lookupMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    setLoading(true)
    setError('')
    setProfile(null)

    // Try both types
    try {
      const [tenantRes, ownerRes] = await Promise.all([
        fetch('/api/profiles?mobile=' + lookupMobile + '&type=tenant'),
        fetch('/api/profiles?mobile=' + lookupMobile + '&type=owner'),
      ])
      const [tenantData, ownerData] = await Promise.all([tenantRes.json(), ownerRes.json()])

      if (tenantData.found) {
        setProfile(tenantData.profile)
        setMobile(lookupMobile)
        loadLeadsForTenant(tenantData.profile)
      } else if (ownerData.found) {
        setProfile(ownerData.profile)
        setMobile(lookupMobile)
        loadLeadsForOwner(ownerData.profile)
      } else {
        setError('No profile found for this mobile number. Would you like to create one?')
      }
    } catch {
      setError('Failed to lookup profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadLeadsForTenant = async (prof: any) => {
    // For tenant: show available real PGs matching their preferences
    setLoadingLeads(true)
    try {
      const matchedCities = prof.preferred_cities || []
      const cityParam = matchedCities[0] ? `?city=${encodeURIComponent(matchedCities[0])}` : ''
      const res = await fetch(`/api/properties${cityParam}`)
      const data = await res.json()
      let props = data.success && Array.isArray(data.properties) ? data.properties : []
      if (props.length === 0 && cityParam) {
        const allRes = await fetch('/api/properties')
        const allData = await allRes.json()
        props = allData.success && Array.isArray(allData.properties) ? allData.properties : []
      }
      setTenantLeads(props.slice(0, 6))
    } catch {
      setTenantLeads([])
    } finally {
      setLoadingLeads(false)
    }
  }

  const loadLeadsForOwner = async (prof: any) => {
    // For owner: show tenant profiles searching in their cities
    setLoadingLeads(true)
    try {
      const cities = prof.operating_cities || []
      const city = cities[0] || ''
      const res = await fetch('/api/profiles?type=tenant&city=' + encodeURIComponent(city))
      const data = await res.json()
      setTenantLeads(data.profiles || [])
    } catch {
      setTenantLeads([])
    } finally {
      setLoadingLeads(false)
    }
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem('pgsetu_profile_id')
      localStorage.removeItem('pgsetu_profile_type')
      localStorage.removeItem('pgsetu_profile_mobile')
      localStorage.removeItem('pgsetu_profile_data')
    } catch {}
    setProfile(null)
    setMobile('')
    setMobileInput('')
  }

  const isTenant = profile?.type === 'tenant'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-black text-slate-900 tracking-tight">PG-Setu</span>
          </Link>
          <div className="flex items-center gap-3">
            {profile && (
              <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            )}
            <Link href="/create-profile" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full transition hover:bg-emerald-50">
              + New Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Mobile Lookup */}
        {!profile && (
          <div className="max-w-md mx-auto space-y-6 pt-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                <User className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-black text-slate-900">My Profile Dashboard</h1>
              <p className="text-sm text-slate-500">Enter your registered mobile number to access your profile</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">+91</span>
                <input
                  type="tel"
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition"
                  placeholder="Enter your mobile number"
                  value={mobileInput}
                  onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyDown={(e) => e.key === 'Enter' && lookupProfile()}
                  maxLength={10}
                />
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <button
                onClick={() => lookupProfile()}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Looking up...' : 'Access My Profile'}
              </button>
              <p className="text-center text-xs text-slate-400">
                No profile yet?{' '}
                <Link href="/create-profile" className="text-emerald-600 font-bold hover:underline">Create one free →</Link>
              </p>
            </div>
          </div>
        )}

        {/* Profile Found */}
        {profile && (
          <div className="space-y-6">
            {/* Profile Header Card */}
            <div className={cn(
              'rounded-3xl border-2 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5',
              isTenant ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
            )}>
              <div className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0',
                isTenant ? 'bg-blue-200' : 'bg-amber-200'
              )}>
                {isTenant ? <Users className="w-8 h-8 text-blue-700" /> : <Home className="w-8 h-8 text-amber-700" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900">{profile.full_name}</h2>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold font-mono',
                    isTenant ? 'bg-blue-200 text-blue-800' : 'bg-amber-200 text-amber-800'
                  )}>
                    {profile.id}
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-bold',
                    profile.profile_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  )}>
                    ● {profile.profile_status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +91 {profile.mobile}</span>
                  {profile.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {profile.email}</span>}
                  {isTenant && profile.current_city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.current_city}</span>}
                  {!isTenant && profile.operating_cities?.length > 0 && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.operating_cities.join(', ')}</span>
                  )}
                </div>
              </div>

              <Link
                href="/create-profile"
                className="text-xs font-bold text-slate-600 border border-slate-300 px-3 py-1.5 rounded-xl hover:bg-white transition flex items-center gap-1 shrink-0"
              >
                <Edit className="w-3 h-3" /> Update Profile
              </Link>
            </div>

            {/* Active PG Stay Card (Synced from PG Owner check-in) */}
            {isTenant && profile.current_stay && (
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border border-blue-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Active PG Accommodation</span>
                    <h3 className="text-lg sm:text-xl font-black text-white">{profile.current_stay.organization_name}</h3>
                    {profile.current_stay.property_name && (
                      <p className="text-xs text-blue-200 mt-0.5">{profile.current_stay.property_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold uppercase tracking-wider">
                      ● {profile.current_stay.status || 'Active Stay'}
                    </span>
                    <Link
                      href="/portal"
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
                    >
                      View Passbook →
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                    <span className="text-blue-200 text-[10px] font-semibold uppercase block">Room &amp; Bed</span>
                    <span className="font-black text-white text-sm">
                      Room {profile.current_stay.room_number || '—'} · Bed {profile.current_stay.bed_label || '—'}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                    <span className="text-blue-200 text-[10px] font-semibold uppercase block">Monthly Rent</span>
                    <span className="font-black text-white text-sm">
                      {profile.current_stay.monthly_rent_paise ? `₹${(profile.current_stay.monthly_rent_paise / 100).toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                    <span className="text-blue-200 text-[10px] font-semibold uppercase block">Outstanding Balance</span>
                    <span className={`font-black text-sm ${profile.current_stay.total_outstanding_paise > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {profile.current_stay.total_outstanding_paise > 0 ? `₹${(profile.current_stay.total_outstanding_paise / 100).toLocaleString('en-IN')}` : 'Paid (₹0)'}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                    <span className="text-blue-200 text-[10px] font-semibold uppercase block">Check-in Date</span>
                    <span className="font-black text-white text-sm">
                      {profile.current_stay.check_in_date || '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Details */}
            {isTenant ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Budget Range</p>
                  <p className="text-lg font-black text-slate-900">
                    {formatBudget(profile.budget_min_paise)} – {formatBudget(profile.budget_max_paise)}
                  </p>
                  <p className="text-xs text-slate-500">per month</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Room Type</p>
                  <p className="text-lg font-black text-slate-900 capitalize">{profile.preferred_room_type || 'Any'}</p>
                  {profile.move_in_date && <p className="text-xs text-slate-500">Move-in: {profile.move_in_date}</p>}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Preferred Cities</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(profile.preferred_cities || []).map((c: string) => (
                      <span key={c} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Beds (Approx)</p>
                  <p className="text-lg font-black text-slate-900">{profile.total_beds_approx || 0}</p>
                  <p className="text-xs text-slate-500">{profile.experience_years ? profile.experience_years + ' yrs experience' : 'New Owner'}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Property Types</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(profile.property_types || []).map((pt: string) => (
                      <span key={pt} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold capitalize">{pt}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Operating Cities</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(profile.operating_cities || []).map((c: string) => (
                      <span key={c} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Amenities (tenant) */}
            {isTenant && profile.required_amenities?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Required Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {profile.required_amenities.map((a: string) => (
                    <span key={a} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                      {getAmenityLabel(a)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Leads Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-slate-900">
                  {isTenant ? 'PGs Matching Your Preferences' : 'Tenants Looking in Your Cities'}
                </h3>
                <button
                  onClick={() => isTenant ? loadLeadsForTenant(profile) : loadLeadsForOwner(profile)}
                  className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              {loadingLeads && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                </div>
              )}

              {!loadingLeads && tenantLeads.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                  <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    {isTenant
                      ? 'No PGs found in your preferred cities yet. More are being added daily!'
                      : 'No tenants currently searching in your cities. Check back soon!'}
                  </p>
                </div>
              )}

              {!loadingLeads && tenantLeads.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {isTenant ? (
                    // PG Listings for tenant
                    tenantLeads.map((pg: any) => (
                      <div key={pg.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition group">
                        <div className="h-32 bg-gradient-to-br from-slate-200 to-slate-300 relative">
                          {pg.imageUrl && <img src={pg.imageUrl} alt={pg.title} className="w-full h-full object-cover" />}
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">{pg.type || 'PG'}</span>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{pg.title}</h4>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" /> {pg.locality || pg.city}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-black text-emerald-700">
                              ₹{pg.price?.toLocaleString('en-IN')}/mo
                            </p>
                            <Link href={'/?q=' + encodeURIComponent(pg.title || '')} className="text-xs text-emerald-600 font-bold hover:underline">
                              View →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Tenant leads for owners
                    tenantLeads.map((lead: any) => (
                      <div key={lead.id} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 hover:shadow-md transition">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{lead.full_name}</p>
                            <p className="text-[10px] font-mono text-blue-600">{lead.id}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {lead.budget_min_paise && (
                            <p className="text-xs text-slate-600">
                              Budget: {formatBudget(lead.budget_min_paise)} – {formatBudget(lead.budget_max_paise)}
                            </p>
                          )}
                          {lead.preferred_room_type && (
                            <p className="text-xs text-slate-600 capitalize">Room: {lead.preferred_room_type}</p>
                          )}
                          {lead.move_in_date && (
                            <p className="text-xs text-slate-600">Move-in: {lead.move_in_date}</p>
                          )}
                          {lead.preferred_cities?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {lead.preferred_cities.slice(0, 3).map((c: string) => (
                                <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold">{c}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function MyProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <ProfileDashboardContent />
    </Suspense>
  )
}