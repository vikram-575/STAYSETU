'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Users, Home, Search, RefreshCw, Trash2, Eye, X, Loader2,
  MapPin, Phone, Mail, Calendar, Building2, Star, CheckCircle2,
  AlertCircle, Filter, Download, User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBudget, AMENITY_OPTIONS } from '@/lib/profiles'

// ─── Types ──────────────────────────────────────────────────────────────────
type SubTab = 'tenants' | 'owners'

function getAmenityLabel(val: string) {
  return AMENITY_OPTIONS.find(a => a.value === val)?.label || val
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-amber-100 text-amber-700',
    deactivated: 'bg-red-100 text-red-700',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', colors[status] || 'bg-slate-100 text-slate-600')}>
      ● {status}
    </span>
  )
}

// ─── Profile Detail Modal ──────────────────────────────────────────────────
function ProfileDetailModal({ profile, onClose, onDelete }: { profile: any; onClose: () => void; onDelete: (id: string) => void }) {
  const isTenant = profile?.type === 'tenant'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className={cn(
          'p-6 border-b border-slate-700 flex items-start justify-between gap-4 rounded-t-3xl',
          isTenant ? 'bg-blue-900/30' : 'bg-amber-900/20'
        )}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'text-xs font-black px-2 py-0.5 rounded-full font-mono',
                isTenant ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'
              )}>
                {profile.id}
              </span>
              <StatusBadge status={profile.profile_status} />
            </div>
            <h2 className="text-xl font-black text-white">{profile.full_name}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +91 {profile.mobile}</span>
              {profile.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {profile.email}</span>}
              {profile.gender && <span className="capitalize">{profile.gender}</span>}
              {profile.dob && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {profile.dob}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {isTenant ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Budget/Month</p>
                  <p className="text-base font-black text-white">
                    {formatBudget(profile.budget_min_paise)} – {formatBudget(profile.budget_max_paise)}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Room Type</p>
                  <p className="text-base font-black text-white capitalize">{profile.preferred_room_type || 'Any'}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Current City</p>
                  <p className="text-base font-black text-white">{profile.current_city || '—'}</p>
                </div>
              </div>

              {profile.preferred_cities?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Preferred Cities</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferred_cities.map((c: string) => (
                      <span key={c} className="px-3 py-1 bg-blue-900/50 text-blue-300 rounded-full text-xs font-bold">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.required_amenities?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Required Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.required_amenities.map((a: string) => (
                      <span key={a} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full text-xs">{getAmenityLabel(a)}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.profession && (
                <div className="text-sm text-slate-300"><span className="text-slate-500">Profession:</span> <span className="font-semibold capitalize">{profile.profession.replace('_', ' ')}</span></div>
              )}
              {profile.move_in_date && (
                <div className="text-sm text-slate-300"><span className="text-slate-500">Move-in Date:</span> <span className="font-semibold">{profile.move_in_date}</span></div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Beds</p>
                  <p className="text-base font-black text-white">{profile.total_beds_approx || 0}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Experience</p>
                  <p className="text-base font-black text-white">{profile.experience_years ? profile.experience_years + ' yrs' : 'New'}</p>
                </div>
                <div className="bg-slate-800 rounded-xl p-4">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">PAN</p>
                  <p className="text-base font-mono text-white">{profile.pan_number || '—'}</p>
                </div>
              </div>

              {profile.property_types?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Property Types</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.property_types.map((pt: string) => (
                      <span key={pt} className="px-3 py-1 bg-amber-900/50 text-amber-300 rounded-full text-xs font-bold capitalize">{pt}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.operating_cities?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Operating Cities</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.operating_cities.map((c: string) => (
                      <span key={c} className="px-3 py-1 bg-emerald-900/40 text-emerald-300 rounded-full text-xs font-bold">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {profile.gst_number && (
                <div className="text-sm text-slate-300"><span className="text-slate-500">GST:</span> <span className="font-mono">{profile.gst_number}</span></div>
              )}
            </>
          )}

          {profile.additional_notes && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-slate-300">{profile.additional_notes}</p>
            </div>
          )}

          <div className="text-xs text-slate-500">
            Created: {new Date(profile.created_at).toLocaleString('en-IN')} · Last updated: {new Date(profile.updated_at).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={() => { if (confirm(`Delete profile ${profile.id}? This cannot be undone.`)) { onDelete(profile.id); onClose() } }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-400 border border-red-800 rounded-xl hover:bg-red-900/30 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Profile
          </button>
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-xl transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Profiles Tab ─────────────────────────────────────────────────────────────
export default function ProfilesTab() {
  const [subTab, setSubTab] = useState<SubTab>('tenants')
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [total, setTotal] = useState(0)

  const loadProfiles = useCallback(async () => {
    setLoading(true)
    try {
      const type = subTab === 'tenants' ? 'tenant' : 'owner'
      const params = new URLSearchParams({ all: 'true', type, limit: '500' })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch('/api/profiles?' + params.toString())
      const data = await res.json()
      setProfiles(data.profiles || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to load profiles', err)
    } finally {
      setLoading(false)
    }
  }, [subTab, search, statusFilter])

  useEffect(() => { loadProfiles() }, [loadProfiles])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/profiles/' + id, { method: 'DELETE' })
      if (res.ok) {
        setProfiles(prev => prev.filter(p => p.id !== id))
        setTotal(prev => prev - 1)
      }
    } catch {}
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await fetch('/api/profiles/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_status: newStatus }),
      })
      setProfiles(prev => prev.map(p => p.id === id ? { ...p, profile_status: newStatus } : p))
    } catch {}
  }

  const isTenant = subTab === 'tenants'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Marketplace Profiles</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage public Tenant & Owner profiles across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/create-profile"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-800 rounded-xl hover:bg-emerald-900/30 transition"
          >
            <User className="w-3.5 h-3.5" /> Create Profile
          </a>
          <button
            onClick={loadProfiles}
            className="p-2 text-slate-400 hover:text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/60 rounded-2xl w-fit border border-slate-700">
        {(['tenants', 'owners'] as SubTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setSubTab(tab); setSearch(''); setStatusFilter('all') }}
            className={cn(
              'px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2',
              subTab === tab
                ? tab === 'tenants'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-amber-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            )}
          >
            {tab === 'tenants' ? <Users className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {!loading && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px] font-mono">{total}</span>}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, mobile, ID, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none focus:border-emerald-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {/* Summary stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: profiles.length, color: 'text-white' },
            { label: 'Active', value: profiles.filter(p => p.profile_status === 'active').length, color: 'text-emerald-400' },
            { label: 'Paused', value: profiles.filter(p => p.profile_status === 'paused').length, color: 'text-amber-400' },
            { label: 'Deactivated', value: profiles.filter(p => p.profile_status === 'deactivated').length, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
              <p className={cn('text-xl font-black', stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">{isTenant ? '👤' : '🏠'}</div>
            <p className="text-slate-400 text-sm">No {subTab} profiles found</p>
            <a href="/create-profile" target="_blank" className="inline-block mt-3 text-xs text-emerald-400 hover:underline">
              Create the first profile →
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/80 border-b border-slate-700">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Name & Contact</th>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {isTenant ? 'Preferred Cities' : 'Operating Cities'}
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {isTenant ? 'Budget' : 'Beds / Properties'}
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile, idx) => (
                  <tr
                    key={profile.id}
                    className={cn(
                      'border-b border-slate-800/50 hover:bg-slate-800/40 transition cursor-pointer',
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/50'
                    )}
                    onClick={() => setSelectedProfile(profile)}
                  >
                    <td className="px-4 py-3">
                      <span className={cn(
                        'font-mono text-xs font-bold px-2 py-0.5 rounded',
                        isTenant ? 'text-blue-400 bg-blue-900/30' : 'text-amber-400 bg-amber-900/20'
                      )}>
                        {profile.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-white">{profile.full_name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Phone className="w-3 h-3" /> {profile.mobile}
                        {profile.email && <span>· {profile.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {(isTenant ? profile.preferred_cities : profile.operating_cities)?.slice(0, 3).map((c: string) => (
                          <span key={c} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px]">{c}</span>
                        ))}
                        {((isTenant ? profile.preferred_cities : profile.operating_cities)?.length > 3) && (
                          <span className="text-[10px] text-slate-500">+{(isTenant ? profile.preferred_cities : profile.operating_cities).length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {isTenant
                        ? `${formatBudget(profile.budget_min_paise)} – ${formatBudget(profile.budget_max_paise)}`
                        : `${profile.total_beds_approx || 0} beds · ${profile.property_types?.join(', ') || '—'}`
                      }
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={profile.profile_status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(profile.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedProfile(profile)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <select
                          value={profile.profile_status}
                          onChange={(e) => handleStatusUpdate(profile.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-1 py-1 outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="deactivated">Deactivated</option>
                        </select>
                        <button
                          onClick={() => { if (confirm('Delete this profile?')) handleDelete(profile.id) }}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <ProfileDetailModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}