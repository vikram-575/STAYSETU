'use client'

import React, { useState, useEffect } from 'react'
import {
  Network, Building2, Layers, BedDouble, User,
  CheckCircle2, AlertCircle, Wrench, Ban, Search,
  ChevronDown, ChevronRight, RefreshCw, ShieldAlert, Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/money'

export default function StructureTab() {
  const [properties, setProperties] = useState<any[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [hierarchy, setHierarchy] = useState<any>(null)
  const [loadingProps, setLoadingProps] = useState(true)
  const [loadingTree, setLoadingTree] = useState(false)
  const [statusUpdatingBedId, setStatusUpdatingBedId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  // Load all properties for selector
  const loadProperties = async () => {
    setLoadingProps(true)
    try {
      const res = await fetch('/api/admin/structure?section=list_properties')
      const data = await res.json()
      if (data.success && data.properties?.length > 0) {
        setProperties(data.properties)
        setSelectedPropertyId(data.properties[0].id)
      }
    } catch (err) {
      console.error('Failed to load property list', err)
    } finally {
      setLoadingProps(false)
    }
  }

  // Load tree for selected property
  const loadHierarchy = async (propId: string) => {
    if (!propId) return
    setLoadingTree(true)
    setStatusError(null)
    try {
      const res = await fetch(`/api/admin/structure?property_id=${propId}`)
      const data = await res.json()
      if (data.success) {
        setHierarchy(data.hierarchy)
      }
    } catch (err) {
      console.error('Failed to load hierarchy tree', err)
    } finally {
      setLoadingTree(false)
    }
  }

  useEffect(() => {
    loadProperties()
  }, [])

  useEffect(() => {
    if (selectedPropertyId) {
      loadHierarchy(selectedPropertyId)
    }
  }, [selectedPropertyId])

  // Change Bed Status
  const handleUpdateBedStatus = async (bedId: string, newStatus: string) => {
    setStatusUpdatingBedId(bedId)
    setStatusError(null)
    try {
      const res = await fetch('/api/admin/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_bed_status',
          bed_id: bedId,
          status: newStatus,
        }),
      })
      const data = await res.json()
      if (data.success) {
        loadHierarchy(selectedPropertyId)
      } else {
        setStatusError(data.error || 'Failed to update bed status')
      }
    } catch (err: any) {
      setStatusError(err?.message || 'Error updating bed status')
    } finally {
      setStatusUpdatingBedId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Property Selector */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-emerald-400" />
            Physical Property Structure & Bed Matrix
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time hierarchy: Property → Building → Floor → Room → Bed → Assigned Resident.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400">Select Campus:</label>
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            disabled={loadingProps || properties.length === 0}
            className="bg-slate-800 border border-slate-700 text-xs font-bold text-white rounded-xl px-3 py-2 focus:outline-none max-w-xs"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city}) · {p.owner_name}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadHierarchy(selectedPropertyId)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
            title="Refresh Structure"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          </button>
        </div>
      </div>

      {statusError && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{statusError}</span>
        </div>
      )}

      {/* Structure Tree View */}
      {loadingTree ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">Traversing building blocks, rooms and bed states...</p>
        </div>
      ) : !hierarchy ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900/60 border border-slate-800 rounded-2xl">
          Select a property above to inspect its room layout and bed matrix.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Property Summary Pill */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-sm">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{hierarchy.name}</h4>
                <p className="text-[11px] text-slate-400">
                  {hierarchy.address ? `${hierarchy.address}, ` : ''}{hierarchy.city} · Operated by {hierarchy.owner_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-slate-300">
                {hierarchy.buildings?.length || 0} Blocks
              </div>
              <div className="px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-emerald-400">
                Active Bed Matrix
              </div>
            </div>
          </div>

          {/* Buildings Loop */}
          <div className="space-y-4">
            {hierarchy.buildings?.map((bldg: any) => (
              <div key={bldg.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="bg-slate-950/70 p-3.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{bldg.name}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400 border border-slate-700">
                      {bldg.floors?.length || 0} Floors
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {bldg.floors?.map((floor: any) => (
                    <div key={floor.id} className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        {floor.name || `Floor ${floor.floor_number}`}
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({floor.rooms?.length || 0} rooms)
                        </span>
                      </div>

                      {/* Rooms Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {floor.rooms?.map((room: any) => (
                          <div key={room.id} className="p-3.5 bg-slate-800/50 border border-slate-800 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs">
                                Room {room.room_number}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-300 border border-slate-700 uppercase">
                                {room.room_type} · Cap: {room.capacity}
                              </span>
                            </div>

                            {/* Beds within Room */}
                            <div className="space-y-2">
                              {room.beds?.map((bed: any) => {
                                const isOccupied = bed.status === 'occupied' || Boolean(bed.occupant)
                                const isUpdating = statusUpdatingBedId === bed.id

                                return (
                                  <div
                                    key={bed.id}
                                    className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <BedDouble
                                          className={`w-3.5 h-3.5 shrink-0 ${
                                            isOccupied ? 'text-emerald-400' : 'text-slate-500'
                                          }`}
                                        />
                                        <span className="font-bold text-xs text-slate-200 truncate">
                                          Bed {bed.name}
                                        </span>
                                      </div>

                                      {/* Occupant Pill */}
                                      {bed.occupant ? (
                                        <div className="text-[11px] text-slate-300 font-medium mt-0.5 flex items-center gap-1.5">
                                          <span className="text-emerald-400 font-semibold truncate">
                                            {bed.occupant.full_name}
                                          </span>
                                          <span className="font-mono text-[9px] px-1 bg-slate-800 rounded text-slate-400 border border-slate-700 shrink-0">
                                            {bed.occupant.registration_number || 'PG-2026-TEN'}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-slate-500 mt-0.5">Vacant / Unassigned</div>
                                      )}
                                    </div>

                                    {/* Status Modifier */}
                                    <div className="shrink-0 flex items-center gap-1">
                                      <select
                                        value={bed.status}
                                        disabled={isUpdating || isOccupied}
                                        onChange={(e) => handleUpdateBedStatus(bed.id, e.target.value)}
                                        className={`text-[10px] font-bold rounded-lg px-2 py-1 border focus:outline-none ${
                                          bed.status === 'available'
                                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                                            : bed.status === 'occupied'
                                            ? 'bg-blue-950/40 text-blue-300 border-blue-800/60 cursor-not-allowed'
                                            : bed.status === 'maintenance'
                                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                                            : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                                        }`}
                                      >
                                        <option value="available">Available</option>
                                        <option value="occupied">Occupied</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="blocked">Blocked</option>
                                      </select>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
