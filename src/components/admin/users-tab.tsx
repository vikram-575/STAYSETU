'use client'

import React, { useState, useEffect } from 'react'
import {
  UserCog, Plus, Search, ShieldCheck, Mail, Phone,
  Building2, CheckCircle2, XCircle, Clock, Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function UsersTab() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

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

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.success) {
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Failed to load platform users', err)
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

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.organizations?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <UserCog className="w-4 h-4 text-emerald-400" />
            Platform Staff & Identity Administration
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Provision roles, manage operator logins, and audit platform superadmins and property managers.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" /> Provision Account
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, email, phone, PG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="owner">PG Owner</option>
              <option value="manager">Manager / Staff</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase text-slate-400 tracking-wider">
              <tr>
                <th className="px-4 py-3">User & Contact</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Linked Organization</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 text-xs">
                    No platform accounts found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-100">{u.full_name || 'Staff User'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{u.email}</span>
                        {u.phone && <span>· {u.phone}</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'superadmin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : u.role === 'owner'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-300 font-semibold">
                      {u.organizations?.name || 'Platform Level'}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Active
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-white">
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
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="user@pgdomain.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Role Privilege</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="owner">PG Owner (Campus Admin)</option>
                  <option value="manager">Manager / Front-Desk</option>
                  <option value="superadmin">Super Admin (Platform Operator)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
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
    </div>
  )
}
