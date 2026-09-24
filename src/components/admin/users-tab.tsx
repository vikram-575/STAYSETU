'use client'

import React, { useState, useEffect } from 'react'
import {
  UserCog, Plus, Search, ShieldCheck, Mail, Phone,
  Building2, CheckCircle2, XCircle, Clock, Loader2,
  Home, Users, Eye, X, ChevronRight, ExternalLink,
  KeyRound, Copy, Check, MapPin, Bed, Calendar, Shield,
  Sparkles, Filter, RefreshCw, Download, Pencil, Trash2,
  AlertTriangle, AlertCircle
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  alternate_phone?: string | null
  role: string
  user_type: 'owner' | 'tenant' | 'admin' | 'staff'
  display_role: string
  is_active: boolean
  status: string
  created_at: string
  last_login_at?: string | null
  organization_id?: string | null
  organization_name?: string | null
  properties_count?: number
  properties_list?: Array<{ id: string; name: string; city: string }>
  resident_id?: string | null
  registration_number?: string | null
  property_name?: string | null
  room_number?: string | null
  bed_label?: string | null
  monthly_rent_paise?: number
  check_in_date?: string | null
  gender?: string | null
  date_of_birth?: string | null
  emergency_name?: string | null
  emergency_phone?: string | null
  emergency_relation?: string | null
  id_type?: string | null
  id_number?: string | null
  permanent_address?: string | null
  permanent_city?: string | null
  permanent_state?: string | null
  source?: string
}

export default function UsersTab() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<any>({
    total_users: 0,
    total_owners: 0,
    total_tenants: 0,
    total_staff: 0,
    total_admins: 0,
    active_stays: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'owner' | 'tenant' | 'admin' | 'staff'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 25
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState('')

  // 360° Profile Modal
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'owner',
    organization_id: '',
  })

  // Edit User State
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    status: 'active',
    is_active: true,
    role: 'resident',
    organization_name: '',
    monthly_rent: '',
    permanent_address: '',
    permanent_city: '',
    emergency_name: '',
    emergency_phone: '',
  })

  // Delete User State
  const [deletingProfile, setDeletingProfile] = useState<UserProfile | null>(null)
  const [deleteCascadeOrg, setDeleteCascadeOrg] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.success) {
        setUsers(data.users || [])
        if (data.stats) {
          setStats(data.stats)
        }
      } else {
        setFetchError(data.error || 'Failed to fetch platform users.')
      }
    } catch (err: any) {
      console.error('Failed to load platform users and profiles', err)
      setFetchError(err?.message || 'Network error fetching platform users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateError('')
    setCreateSuccess('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      })
      const data = await res.json()
      if (data.success) {
        setCreateSuccess('Platform account created successfully')
        setUserForm({ email: '', password: '', full_name: '', phone: '', role: 'owner', organization_id: '' })
        loadUsers()
        setTimeout(() => {
          setShowCreateModal(false)
          setCreateSuccess('')
        }, 1500)
      } else {
        setCreateError(data.error || 'Failed to create user')
      }
    } catch (err: any) {
      setCreateError(err?.message || 'Error creating user')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const openEditModal = (profile: UserProfile) => {
    setEditingProfile(profile)
    setEditError('')
    setEditSuccess('')
    setEditForm({
      full_name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      alternate_phone: profile.alternate_phone || '',
      status: profile.status || (profile.is_active ? 'active' : 'inactive'),
      is_active: profile.is_active ?? true,
      role: profile.role || (profile.user_type === 'owner' ? 'owner' : 'resident'),
      organization_name: profile.organization_name || '',
      monthly_rent: profile.monthly_rent_paise ? String(Math.round(profile.monthly_rent_paise / 100)) : '',
      permanent_address: profile.permanent_address || '',
      permanent_city: profile.permanent_city || '',
      emergency_name: profile.emergency_name || '',
      emergency_phone: profile.emergency_phone || '',
    })
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProfile) return
    setEditLoading(true)
    setEditError('')
    setEditSuccess('')

    try {
      const rentPaise = editForm.monthly_rent ? Math.round(parseFloat(editForm.monthly_rent) * 100) : undefined
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProfile.id,
          resident_id: editingProfile.resident_id,
          user_type: editingProfile.user_type,
          organization_id: editingProfile.organization_id,
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone,
          alternate_phone: editForm.alternate_phone,
          status: editForm.status,
          is_active: editForm.is_active,
          role: editForm.role,
          organization_name: editForm.organization_name,
          monthly_rent_paise: rentPaise,
          permanent_address: editForm.permanent_address,
          permanent_city: editForm.permanent_city,
          emergency_name: editForm.emergency_name,
          emergency_phone: editForm.emergency_phone,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEditSuccess('Profile successfully updated and synced with Supabase.')
        loadUsers()
        setTimeout(() => {
          setEditingProfile(null)
          setEditSuccess('')
        }, 1200)
      } else {
        setEditError(data.error || 'Failed to update user profile.')
      }
    } catch (err: any) {
      setEditError(err?.message || 'Network error updating user profile.')
    } finally {
      setEditLoading(false)
    }
  }

  const openDeleteModal = (profile: UserProfile) => {
    setDeletingProfile(profile)
    setDeleteCascadeOrg(false)
    setDeleteError('')
    setDeleteSuccess('')
  }

  const handleConfirmDelete = async () => {
    if (!deletingProfile) return
    setDeleteLoading(true)
    setDeleteError('')
    setDeleteSuccess('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deletingProfile.id,
          resident_id: deletingProfile.resident_id,
          user_type: deletingProfile.user_type,
          organization_id: deletingProfile.organization_id,
          delete_organization: deleteCascadeOrg,
          email: deletingProfile.email,
          phone: deletingProfile.phone,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setDeleteSuccess('User and linked records successfully removed from Supabase.')
        loadUsers()
        setTimeout(() => {
          setDeletingProfile(null)
          setDeleteSuccess('')
          if (selectedProfile?.id === deletingProfile.id) {
            setSelectedProfile(null)
          }
        }, 1200)
      } else {
        setDeleteError(data.error || 'Failed to delete user.')
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Network error deleting user.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredUsers = users.filter((u) => {
    if (userTypeFilter !== 'all' && u.user_type !== userTypeFilter) return false
    if (statusFilter === 'active' && !u.is_active && u.status !== 'active') return false
    if (statusFilter === 'inactive' && (u.is_active || u.status === 'active')) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.organization_name?.toLowerCase().includes(q) ||
      u.property_name?.toLowerCase().includes(q) ||
      u.registration_number?.toLowerCase().includes(q) ||
      u.room_number?.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    setPage(1)
  }, [searchQuery, userTypeFilter, statusFilter])

  const paginatedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE)

  const downloadCSV = () => {
    if (filteredUsers.length === 0) return
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'User Type',
      'Role',
      'Registration Number',
      'Organization / PG',
      'Room Number',
      'Bed',
      'Status',
      'Created / Check-in Date'
    ]
    const rows = filteredUsers.map((u) => [
      `"${(u.full_name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.phone || '').replace(/"/g, '""')}"`,
      `"${(u.user_type || '').replace(/"/g, '""')}"`,
      `"${(u.display_role || u.role || '').replace(/"/g, '""')}"`,
      `"${(u.registration_number || '').replace(/"/g, '""')}"`,
      `"${(u.property_name || u.organization_name || '').replace(/"/g, '""')}"`,
      `"${(u.room_number || '').replace(/"/g, '""')}"`,
      `"${(u.bed_label || '').replace(/"/g, '""')}"`,
      `"${(u.status || (u.is_active ? 'active' : 'inactive')).replace(/"/g, '""')}"`,
      `"${u.check_in_date || u.created_at || ''}"`
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `pg-setu-users-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImpersonateUser = async (u: UserProfile) => {
    if (!u.organization_id) {
      alert('This user is not associated with an active PG organization to impersonate.')
      return
    }
    setImpersonatingUserId(u.id)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: u.organization_id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = '/dashboard'
      } else {
        alert(data.error || 'Failed to switch context')
      }
    } catch (err) {
      console.error('Impersonation error', err)
    } finally {
      setImpersonatingUserId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/95 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                All Platform User Profiles & Identity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete directory of PG Owners, Tenants / Residents, and Platform Operators with 360° profile inspection.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition active:scale-95 flex items-center gap-1.5"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Provision Account
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setUserTypeFilter('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            userTypeFilter === 'all'
              ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">Total Platform Users</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.total_users || users.length}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Unified user profiles</p>
        </div>

        <div
          onClick={() => setUserTypeFilter('owner')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            userTypeFilter === 'owner'
              ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-bold">PG Owners & Hosts</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.total_owners || 0}</div>
          <p className="text-[10px] text-amber-400/80 mt-0.5">Operating campuses</p>
        </div>

        <div
          onClick={() => setUserTypeFilter('tenant')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            userTypeFilter === 'tenant'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-bold">Tenants & Residents</span>
            <Home className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.total_tenants || 0}</div>
          <p className="text-[10px] text-emerald-400/80 mt-0.5">{stats.active_stays || 0} active stays</p>
        </div>

        <div
          onClick={() => setUserTypeFilter('admin')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            userTypeFilter === 'admin'
              ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-xs font-bold">Platform Operators</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{(stats.total_admins || 0) + (stats.total_staff || 0)}</div>
          <p className="text-[10px] text-purple-400/80 mt-0.5">Superadmins & staff</p>
        </div>
      </div>

      {fetchError && (
        <div className="p-4 bg-rose-950/70 border border-rose-800/80 rounded-2xl text-xs text-rose-300 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <button
            onClick={loadUsers}
            className="px-3 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Directory Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {[
              { id: 'all', label: 'All Profiles', count: users.length },
              { id: 'owner', label: 'PG Owners', count: stats.total_owners },
              { id: 'tenant', label: 'Tenants & Residents', count: stats.total_tenants },
              { id: 'admin', label: 'Superadmins', count: stats.total_admins },
              { id: 'staff', label: 'Managers', count: stats.total_staff },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setUserTypeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 active:scale-95 ${
                  userTypeFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
                  {tab.count ?? 0}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box & Status Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone, email, PG, room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-medium transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive / Past</option>
            </select>

            <button
              onClick={downloadCSV}
              disabled={filteredUsers.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer shrink-0"
              title="Export filtered users to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">User & Contact</th>
                <th className="px-4 py-3">Profile Type & Role</th>
                <th className="px-4 py-3">Linked PG / Current Stay</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created / Stay Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 mt-2">Loading platform user data profiles...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                    No matching user profiles found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isOwner = u.user_type === 'owner'
                  const isTenant = u.user_type === 'tenant'
                  const isAdmin = u.user_type === 'admin'
                  const initials = u.full_name
                    ? u.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'U'

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* User & Contact */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                              isOwner
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : isTenant
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : isAdmin
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            }`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span className="truncate">{u.full_name || 'User Profile'}</span>
                              {u.registration_number && (
                                <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                                  {u.registration_number}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              {u.email && <span className="truncate">{u.email}</span>}
                              {u.phone && <span>· +91 {u.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Profile Type & Role */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                            isOwner
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : isTenant
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : isAdmin
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {isOwner && <Building2 className="w-3 h-3" />}
                          {isTenant && <Home className="w-3 h-3" />}
                          {isAdmin && <ShieldCheck className="w-3 h-3" />}
                          <span>{u.display_role}</span>
                        </span>
                      </td>

                      {/* Linked PG / Current Stay */}
                      <td className="px-4 py-3.5">
                        {isOwner ? (
                          <div>
                            <div className="font-bold text-slate-200 truncate">
                              {u.organization_name || 'PG Campus Operator'}
                            </div>
                            <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1 mt-0.5">
                              <span>{u.properties_count || 0} Managed PGs</span>
                              {u.properties_list && u.properties_list.length > 0 && (
                                <span className="text-slate-500">
                                  ({u.properties_list.slice(0, 2).map((p) => p.city).filter(Boolean).join(', ')})
                                </span>
                              )}
                            </div>
                          </div>
                        ) : isTenant ? (
                          <div>
                            <div className="font-bold text-slate-200 truncate">
                              {u.property_name || u.organization_name || 'Resident Campus'}
                            </div>
                            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                              {u.room_number && <span>Room {u.room_number}</span>}
                              {u.bed_label && <span>· Bed {u.bed_label}</span>}
                              {u.monthly_rent_paise ? (
                                <span className="text-slate-400">
                                  (₹{(u.monthly_rent_paise / 100).toLocaleString('en-IN')}/mo)
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 font-medium">
                            {u.organization_name || 'PG-SETU Platform HQ'}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            u.is_active || u.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active || u.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          <span>{u.status || (u.is_active ? 'Active' : 'Inactive')}</span>
                        </span>
                      </td>

                      {/* Created / Stay Date */}
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        <div>{formatDate(u.check_in_date || u.created_at)}</div>
                        {u.check_in_date && (
                          <div className="text-[10px] text-slate-500">Check-in date</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedProfile(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition active:scale-95 border border-slate-700 hover:border-slate-600 shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg text-xs font-bold transition active:scale-95 border border-amber-500/30 hover:border-amber-500/50 shadow-xs cursor-pointer"
                          title="Edit user in Supabase"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit</span>
                        </button>
                        {u.user_type !== 'admin' && (
                          <button
                            onClick={() => openDeleteModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-bold transition active:scale-95 border border-rose-500/30 hover:border-rose-500/50 shadow-xs cursor-pointer"
                            title="Delete user and data from Supabase"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete</span>
                          </button>
                        )}
                        {u.organization_id && (u.user_type === 'owner' || u.role === 'owner' || u.role === 'manager') && (
                          <button
                            onClick={() => handleImpersonateUser(u)}
                            disabled={impersonatingUserId === u.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-bold border border-blue-500/30 transition active:scale-95 shadow-xs cursor-pointer"
                            title={`Login as PG Owner/Manager into ${u.organization_name || 'PG'}`}
                          >
                            {impersonatingUserId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                            )}
                            <span>Login as PG</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-bold text-white">{(page - 1) * PAGE_SIZE + 1}</span> to{' '}
              <span className="font-bold text-white">{Math.min(page * PAGE_SIZE, filteredUsers.length)}</span> of{' '}
              <span className="font-bold text-white">{filteredUsers.length}</span> users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-medium transition cursor-pointer"
              >
                Previous
              </button>
              <span className="px-2 font-mono">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-medium transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 360° Profile Slide-over / Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div
              className={`p-5 border-b border-slate-800 flex items-start justify-between gap-4 ${
                selectedProfile.user_type === 'owner'
                  ? 'bg-amber-950/20'
                  : selectedProfile.user_type === 'tenant'
                  ? 'bg-emerald-950/20'
                  : 'bg-purple-950/20'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 border ${
                    selectedProfile.user_type === 'owner'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : selectedProfile.user_type === 'tenant'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  }`}
                >
                  {selectedProfile.full_name
                    ? selectedProfile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-white truncate">
                      {selectedProfile.full_name || 'User Profile'}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        selectedProfile.user_type === 'owner'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : selectedProfile.user_type === 'tenant'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {selectedProfile.display_role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    {selectedProfile.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {selectedProfile.email}
                      </span>
                    )}
                    {selectedProfile.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        +91 {selectedProfile.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedProfile(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Profile Overview Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Profile ID
                  </span>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-200">
                    <span className="truncate">{selectedProfile.id.slice(0, 13)}...</span>
                    <button
                      onClick={() => handleCopyId(selectedProfile.id)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Copy ID"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Account Status
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="capitalize">{selectedProfile.status}</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Member Since
                  </span>
                  <div className="text-xs font-bold text-slate-200">
                    {formatDate(selectedProfile.created_at)}
                  </div>
                </div>
              </div>

              {/* Owner Specific Details */}
              {selectedProfile.user_type === 'owner' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    PG Enterprise & Campus Assets
                  </h4>

                  <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Business Organization</span>
                        <span className="text-sm font-bold text-white">
                          {selectedProfile.organization_name || 'Independent PG Owner'}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                        {selectedProfile.properties_count || 0} Managed PGs
                      </span>
                    </div>

                    {selectedProfile.properties_list && selectedProfile.properties_list.length > 0 && (
                      <div className="pt-2 border-t border-slate-700/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                          Operated Properties:
                        </span>
                        <div className="space-y-1.5">
                          {selectedProfile.properties_list.map((prop) => (
                            <div
                              key={prop.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 text-xs border border-slate-800"
                            >
                              <div className="flex items-center gap-2">
                                <Home className="w-3.5 h-3.5 text-amber-400" />
                                <span className="font-semibold text-slate-200">{prop.name}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">{prop.city}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tenant Specific Details */}
              {selectedProfile.user_type === 'tenant' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Home className="w-4 h-4" />
                    Current PG Stay & Bed Allocation
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Hosted PG Space
                      </span>
                      <span className="text-xs font-bold text-white block truncate">
                        {selectedProfile.property_name || selectedProfile.organization_name || 'Assigned Campus'}
                      </span>
                    </div>

                    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Room & Bed
                      </span>
                      <span className="text-xs font-bold text-emerald-400 block">
                        Room {selectedProfile.room_number || '-'} · Bed {selectedProfile.bed_label || '-'}
                      </span>
                    </div>

                    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Monthly Rent
                      </span>
                      <span className="text-xs font-black text-white block">
                        ₹{selectedProfile.monthly_rent_paise ? (selectedProfile.monthly_rent_paise / 100).toLocaleString('en-IN') : '0'}
                      </span>
                    </div>
                  </div>

                  {/* Personal & Emergency Details */}
                  <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                    <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Identity & Emergency Contact
                    </h5>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Gender & DOB</span>
                        <span className="font-semibold text-slate-200 capitalize">
                          {selectedProfile.gender || 'Not specified'} {selectedProfile.date_of_birth ? `(${selectedProfile.date_of_birth})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Government ID Proof</span>
                        <span className="font-semibold text-slate-200 uppercase">
                          {selectedProfile.id_type || 'Aadhaar'}: {selectedProfile.id_number || 'Verified on file'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Emergency Guardian</span>
                        <span className="font-semibold text-slate-200">
                          {selectedProfile.emergency_name || 'Guardian'} {selectedProfile.emergency_relation ? `(${selectedProfile.emergency_relation})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Emergency Phone</span>
                        <span className="font-semibold text-slate-200">
                          {selectedProfile.emergency_phone ? `+91 ${selectedProfile.emergency_phone}` : '—'}
                        </span>
                      </div>
                      {selectedProfile.permanent_address && (
                        <div className="col-span-2">
                          <span className="text-slate-500 block text-[10px]">Permanent Address</span>
                          <span className="font-semibold text-slate-200">
                            {selectedProfile.permanent_address}, {selectedProfile.permanent_city} {selectedProfile.permanent_state}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => openEditModal(selectedProfile)}
                  className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 border border-amber-500/30 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit in Supabase</span>
                </button>

                {selectedProfile.user_type !== 'admin' && (
                  <button
                    onClick={() => openDeleteModal(selectedProfile)}
                    className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 border border-rose-500/30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete from Supabase</span>
                  </button>
                )}
                {selectedProfile.phone && (
                  <a
                    href={`tel:${selectedProfile.phone}`}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call +91 {selectedProfile.phone}</span>
                  </a>
                )}
                {selectedProfile.email && (
                  <a
                    href={`mailto:${selectedProfile.email}`}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Send Email</span>
                  </a>
                )}
                {selectedProfile.user_type === 'owner' && (
                  <a
                    href="/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open PG ERP</span>
                  </a>
                )}
                {selectedProfile.user_type === 'tenant' && (
                  <a
                    href="/portal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition ml-auto"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Open Tenant Portal</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provision Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Provision New Platform Account
            </h3>

            {createSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs">
                {createSuccess}
              </div>
            )}
            {createError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  placeholder="e.g. Vikram Tomar"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@pgsetu.online"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Role Privilege</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="owner">PG Owner (Campus Host & Enterprise)</option>
                  <option value="resident">Tenant / Resident (Living in PG)</option>
                  <option value="manager">Property Manager / Front-Desk</option>
                  <option value="superadmin">Super Admin (Platform Operator)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit User / Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-amber-950/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Edit Profile in Supabase</h3>
                  <p className="text-xs text-slate-400">
                    {editingProfile.display_role} · {editingProfile.full_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProfile(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {editSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{editSuccess}</span>
                </div>
              )}
              {editError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Phone Number (10 digits)</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      status: e.target.value,
                      is_active: e.target.value === 'active'
                    })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    {editingProfile.user_type === 'tenant' && <option value="checked_out">Checked Out</option>}
                  </select>
                </div>
              </div>

              {/* PG Owner Specific Settings */}
              {editingProfile.user_type === 'owner' && (
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>PG Business / Organization</span>
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">PG Name / Organization Name</label>
                    <input
                      type="text"
                      value={editForm.organization_name}
                      onChange={(e) => setEditForm({ ...editForm, organization_name: e.target.value })}
                      placeholder="e.g. Setu Luxury PG"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Tenant / Resident Specific Settings */}
              {editingProfile.user_type === 'tenant' && (
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5" />
                    <span>Resident & Stay Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Alternate Phone</label>
                      <input
                        type="tel"
                        value={editForm.alternate_phone}
                        onChange={(e) => setEditForm({ ...editForm, alternate_phone: e.target.value })}
                        placeholder="Alternate contact"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Monthly Rent (₹)</label>
                      <input
                        type="number"
                        value={editForm.monthly_rent}
                        onChange={(e) => setEditForm({ ...editForm, monthly_rent: e.target.value })}
                        placeholder="e.g. 8500"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Permanent City</label>
                      <input
                        type="text"
                        value={editForm.permanent_city}
                        onChange={(e) => setEditForm({ ...editForm, permanent_city: e.target.value })}
                        placeholder="e.g. Lucknow"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Permanent Address</label>
                      <input
                        type="text"
                        value={editForm.permanent_address}
                        onChange={(e) => setEditForm({ ...editForm, permanent_address: e.target.value })}
                        placeholder="Full address"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={editForm.emergency_name}
                        onChange={(e) => setEditForm({ ...editForm, emergency_name: e.target.value })}
                        placeholder="Guardian / Parent"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Emergency Phone</label>
                      <input
                        type="tel"
                        value={editForm.emergency_phone}
                        onChange={(e) => setEditForm({ ...editForm, emergency_phone: e.target.value })}
                        placeholder="Emergency mobile"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save & Sync to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-rose-800/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-rose-900/40 bg-rose-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-200">Delete from Supabase</h3>
                  <p className="text-xs text-rose-300/80">Permanent Removal Action</p>
                </div>
              </div>
              <button
                onClick={() => setDeletingProfile(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {deleteSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{deleteSuccess}</span>
                </div>
              )}
              {deleteError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Selected Profile:</span>
                  <span className="font-extrabold text-white">{deletingProfile.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Role:</span>
                  <span className="font-bold text-amber-300">{deletingProfile.display_role}</span>
                </div>
                {deletingProfile.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Mobile:</span>
                    <span className="font-mono text-slate-200">+91 {deletingProfile.phone}</span>
                  </div>
                )}
                {deletingProfile.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Email:</span>
                    <span className="font-mono text-slate-200 truncate max-w-[200px]">{deletingProfile.email}</span>
                  </div>
                )}
                {deletingProfile.organization_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Linked PG:</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                      {deletingProfile.organization_name}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl text-amber-200 flex items-start gap-2 text-[11px] leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  {deletingProfile.user_type === 'tenant' ? (
                    <span>
                      Deleting this tenant will <strong>vacate their assigned bed</strong>, remove resident records, ledger, invoices, deposits, and their Supabase user account permanently.
                    </span>
                  ) : (
                    <span>
                      Deleting this owner will remove their platform login and Supabase user account.
                    </span>
                  )}
                </div>
              </div>

              {/* Owner cascade option */}
              {deletingProfile.user_type === 'owner' && deletingProfile.organization_id && (
                <label className="flex items-start gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:bg-slate-950/80 transition">
                  <input
                    type="checkbox"
                    checked={deleteCascadeOrg}
                    onChange={(e) => setDeleteCascadeOrg(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-bold text-slate-200 block">
                      Also purge and delete the entire PG organization ({deletingProfile.organization_name})
                    </span>
                    <span className="text-slate-400 block mt-0.5">
                      Check this only if you want to permanently delete all properties, rooms, beds, and tenant data belonging to this PG.
                    </span>
                  </div>
                </label>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingProfile(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50"
                >
                  {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirm & Delete from Supabase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
