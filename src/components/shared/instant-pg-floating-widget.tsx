'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Zap, Sparkles, X, CheckCircle2, Phone, MapPin,
  Building2, Users, IndianRupee, Calendar, MessageSquare,
  Loader2, ArrowRight, ShieldCheck, Clock
} from 'lucide-react'

export default function InstantPgFloatingWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<any | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('Bengaluru')
  const [area, setArea] = useState('')
  const [pgType, setPgType] = useState('any')
  const [sharing, setSharing] = useState('double')
  const [budget, setBudget] = useState('8k-12k')
  const [moveIn, setMoveIn] = useState('immediate')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')

  // Hide widget inside dashboard and admin consoles to keep their workspace clean
  if (
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/superman') ||
    pathname?.startsWith('/superadmin')
  ) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Please enter your full name.')
      return
    }

    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.')
      return
    }

    setIsSubmitting(true)

    try {
      const cityArea = area.trim() ? `${city} (${area.trim()})` : city
      const payload = {
        tenant_name: name.trim(),
        tenant_phone: cleanPhone,
        property_city: cityArea,
        gender: pgType,
        pg_type: pgType,
        sharing_choice: sharing === 'single' ? 'Single Room' : sharing === 'double' ? '2-Sharing' : sharing === 'triple' ? '3-Sharing' : 'Any Sharing',
        budget_range: budget === 'under-8k' ? 'Under ₹8,000' : budget === '8k-12k' ? '₹8,000 - ₹12,000' : budget === '12k-16k' ? '₹12,000 - ₹16,000' : '₹16,000+',
        move_in_date: moveIn === 'immediate' ? 'Immediate / Today' : moveIn === '3-days' ? 'Within 3 Days' : moveIn === 'week' ? 'This Week' : 'Next Month',
        notes: notes.trim(),
        type: 'instant_pg',
        status: 'new',
      }

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSubmittedData({
          referenceCode: data.referenceCode || `PG-INSTA-${Math.floor(1000 + Math.random() * 9000)}`,
          name: name.trim(),
          phone: cleanPhone,
          city: cityArea,
        })
      } else {
        setFormError(data.error || 'Failed to submit request. Please try again.')
      }
    } catch (err: any) {
      setFormError(err?.message || 'Connection error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setSubmittedData(null)
    setName('')
    setPhone('')
    setArea('')
    setNotes('')
    setFormError('')
    setIsOpen(false)
  }

  return (
    <>
      {/* FLOATING ACTION BUTTON (TRIGGER) */}
      <div className="fixed bottom-5 right-5 z-40 select-none">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 text-white font-black text-xs sm:text-sm rounded-full shadow-2xl shadow-emerald-700/40 hover:shadow-emerald-600/60 active:scale-95 transition-all duration-300 border-2 border-white/20 backdrop-blur-sm"
          title="Book Instant Verified PG"
        >
          {/* Beacon Pulse Ring */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white shadow-xs"></span>
          </span>

          <div className="w-7 h-7 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
            <Zap className="w-4 h-4 fill-emerald-950" />
          </div>

          <div className="text-left leading-tight pr-1">
            <div className="flex items-center gap-1.5">
              <span>⚡ Get Instant PG</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-300/25 text-amber-200 border border-amber-300/30">
                15 MIN ALLOTMENT
              </span>
            </div>
            <p className="text-[10px] text-emerald-100 font-normal hidden sm:block">
              Zero Brokerage • Verified Stays
            </p>
          </div>
        </button>
      </div>

      {/* POPUP MODAL DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 sm:p-6 shrink-0 relative">
              <button
                onClick={handleReset}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-emerald-950 flex items-center gap-1 shadow-xs">
                  <Zap className="w-3 h-3 fill-emerald-950" />
                  Fast-Track Allotment
                </span>
                <span className="text-xs text-emerald-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 15 Mins Response
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                ⚡ Get Instant Verified PG Allotment
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Fill your requirements & our centralized Super Admin team will match you with ready-to-move beds immediately.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {submittedData ? (
                /* SUCCESS VIEW */
                <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-black bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Tracking Code: {submittedData.referenceCode}
                    </span>
                    <h4 className="text-lg font-black text-gray-900 mt-2">
                      Instant PG Request Registered!
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Thank you <strong className="text-gray-900">{submittedData.name}</strong>! Your requirement has been routed directly to our Super Admin and Local PG Wardens in <strong className="text-gray-900">{submittedData.city}</strong>.
                    </p>
                  </div>

                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-left space-y-2 text-xs text-emerald-950">
                    <div className="flex items-center gap-2 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>What happens next?</span>
                    </div>
                    <ul className="text-[11px] text-emerald-800 space-y-1 list-disc pl-4">
                      <li>Our team will call / WhatsApp you on <strong>{submittedData.phone}</strong> within 15 minutes.</li>
                      <li>You will receive 3 verified PG options with photos and locked pricing.</li>
                      <li>Zero brokerage fee applies.</li>
                    </ul>
                  </div>

                  {/* 1-Click WhatsApp Connect */}
                  <div className="pt-2 flex flex-col gap-2">
                    <a
                      href={`https://wa.me/919876543210?text=${encodeURIComponent(
                        `Hi PG-Setu Team! I just submitted Instant PG Request ${submittedData.referenceCode} for ${submittedData.city}. Please share available verified rooms!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-[#00A884] hover:bg-[#008f6f] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Chat with PG Allotment Officer on WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition"
                    >
                      Done & Close
                    </button>
                  </div>
                </div>
              ) : (
                /* INTAKE FORM VIEW */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                      {formError}
                    </div>
                  )}

                  {/* Row 1: Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center">
                        <span className="px-2.5 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-xs text-gray-600 font-bold">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="98765 43210"
                          className="w-full bg-gray-50 border border-gray-200 rounded-r-xl px-3 py-2.5 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: City & Preferred Locality */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                        Target City
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                      >
                        <option value="Bengaluru">Bengaluru</option>
                        <option value="Pune">Pune</option>
                        <option value="Delhi-NCR">Delhi / Gurgaon / Noida</option>
                        <option value="Kota">Kota</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Mumbai">Mumbai / Navi Mumbai</option>
                        <option value="Chennai">Chennai</option>
                        <option value="Indore">Indore</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                        Locality / Tech Park / College
                      </label>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="e.g. Koramangala / Hinjewadi / Allen"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Row 3: PG Type & Sharing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                        PG Type
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'boys', label: 'Boys' },
                          { id: 'girls', label: 'Girls' },
                          { id: 'any', label: 'Co-live' },
                        ].map((t) => (
                          <button
                            type="button"
                            key={t.id}
                            onClick={() => setPgType(t.id)}
                            className={`py-2 text-xs font-bold rounded-xl border transition ${
                              pgType === t.id
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                        Room Sharing Preference
                      </label>
                      <select
                        value={sharing}
                        onChange={(e) => setSharing(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                      >
                        <option value="single">Single Private Room</option>
                        <option value="double">2-Sharing (Double)</option>
                        <option value="triple">3-Sharing (Triple)</option>
                        <option value="any">Any Sharing / Best Price</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 4: Budget & Move-in Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                        Monthly Budget
                      </label>
                      <select
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                      >
                        <option value="under-8k">Under ₹8,000 / month</option>
                        <option value="8k-12k">₹8,000 - ₹12,000 / month</option>
                        <option value="12k-16k">₹12,000 - ₹16,000 / month</option>
                        <option value="16k+">₹16,000+ (Premium)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                        Move-in Timeline
                      </label>
                      <select
                        value={moveIn}
                        onChange={(e) => setMoveIn(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-800"
                      >
                        <option value="immediate">⚡ Immediate / Today</option>
                        <option value="3-days">Within 3 Days</option>
                        <option value="week">This Week</option>
                        <option value="month">Next Month</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes / Optional */}
                  <div>
                    <label className="text-[11px] font-black uppercase text-gray-500 block mb-1">
                      Specific Notes / Office / Food Preference (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. AC required, pure vegetarian mess, walking to metro"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-700/30 active:scale-98 transition flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Matching Nearby Verified PGs...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                          <span>Get Instant PG Options Now →</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-center text-gray-400 mt-2">
                      🔒 100% Free Service · Zero Brokerage · Instant Super Admin Dispatch
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
