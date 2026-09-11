'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2, Users, Home, ArrowRight, ArrowLeft, CheckCircle2,
  Phone, User, Mail, MapPin, Calendar, Briefcase, Star,
  Shield, Loader2, Copy, Check, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AMENITY_OPTIONS, PROFESSION_OPTIONS, CITY_OPTIONS, PROPERTY_TYPE_OPTIONS, type RoomType,
} from '@/lib/profiles'

// ─── Types ──────────────────────────────────────────────────────────────────
type ProfileType = 'tenant' | 'owner' | null
type Step = 'choose' | 'form' | 'success'

interface FormState {
  // Common
  full_name: string
  mobile: string
  email: string
  dob: string
  gender: string
  // Tenant
  profession: string
  current_city: string
  preferred_cities: string[]
  budget_min: string
  budget_max: string
  required_amenities: string[]
  preferred_room_type: RoomType
  move_in_date: string
  additional_notes: string
  // Owner
  operating_cities: string[]
  property_types: string[]
  total_beds_approx: string
  experience_years: string
  pan_number: string
  gst_number: string
}

const DEFAULT_FORM: FormState = {
  full_name: '', mobile: '', email: '', dob: '', gender: '',
  profession: '', current_city: '', preferred_cities: [], budget_min: '', budget_max: '',
  required_amenities: [], preferred_room_type: 'any', move_in_date: '',
  additional_notes: '', operating_cities: [], property_types: [], total_beds_approx: '',
  experience_years: '', pan_number: '', gst_number: '',
}

// ─── Multi-select toggle ─────────────────────────────────────────────────────
function ToggleChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
        active
          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
      )}
    >
      {label}
    </button>
  )
}

// ─── Field component ─────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLASS = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition'
const SELECT_CLASS = INPUT_CLASS

// ─── Tenant Form ─────────────────────────────────────────────────────────────
function TenantForm({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <input className={INPUT_CLASS} value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Priya Sharma" />
        </Field>
        <Field label="Mobile Number" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">+91</span>
            <input className={cn(INPUT_CLASS, 'pl-12')} value={form.mobile} onChange={(e) => setForm(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="9876543210" maxLength={10} />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email Address">
          <input type="email" className={INPUT_CLASS} value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="priya@example.com" />
        </Field>
        <Field label="Date of Birth">
          <input type="date" className={INPUT_CLASS} value={form.dob} onChange={(e) => setForm(p => ({ ...p, dob: e.target.value }))} max={new Date().toISOString().split('T')[0]} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Gender">
          <select className={SELECT_CLASS} value={form.gender} onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other / Prefer not to say</option>
          </select>
        </Field>
        <Field label="Profession">
          <select className={SELECT_CLASS} value={form.profession} onChange={(e) => setForm(p => ({ ...p, profession: e.target.value }))}>
            <option value="">Select profession</option>
            {PROFESSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Current City" required>
          <select className={SELECT_CLASS} value={form.current_city} onChange={(e) => setForm(p => ({ ...p, current_city: e.target.value }))}>
            <option value="">Select your city</option>
            {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Expected Move-in Date">
          <input type="date" className={INPUT_CLASS} value={form.move_in_date} onChange={(e) => setForm(p => ({ ...p, move_in_date: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
        </Field>
      </div>

      <Field label="Preferred Cities for PG" required>
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          {CITY_OPTIONS.map(c => (
            <ToggleChip key={c} label={c} active={form.preferred_cities.includes(c)}
              onClick={() => setForm(p => ({ ...p, preferred_cities: toggle(p.preferred_cities, c) }))} />
          ))}
        </div>
        {form.preferred_cities.length > 0 && (
          <p className="text-xs text-emerald-600 font-semibold mt-1">✓ {form.preferred_cities.length} cities selected</p>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Budget (₹/month)" required>
          <input type="number" className={INPUT_CLASS} value={form.budget_min} onChange={(e) => setForm(p => ({ ...p, budget_min: e.target.value }))} placeholder="5000" min="1000" step="500" />
        </Field>
        <Field label="Max Budget (₹/month)" required>
          <input type="number" className={INPUT_CLASS} value={form.budget_max} onChange={(e) => setForm(p => ({ ...p, budget_max: e.target.value }))} placeholder="15000" min="1000" step="500" />
        </Field>
      </div>

      <Field label="Preferred Room Type">
        <div className="flex gap-2 flex-wrap">
          {(['any', 'single', 'double', 'triple', 'dormitory'] as RoomType[]).map(rt => (
            <ToggleChip key={rt} label={rt.charAt(0).toUpperCase() + rt.slice(1)} active={form.preferred_room_type === rt}
              onClick={() => setForm(p => ({ ...p, preferred_room_type: rt }))} />
          ))}
        </div>
      </Field>

      <Field label="Required Amenities">
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          {AMENITY_OPTIONS.map(a => (
            <ToggleChip key={a.value} label={a.label} active={form.required_amenities.includes(a.value)}
              onClick={() => setForm(p => ({ ...p, required_amenities: toggle(p.required_amenities, a.value) }))} />
          ))}
        </div>
      </Field>

      <Field label="Additional Notes">
        <textarea className={cn(INPUT_CLASS, 'resize-none h-20')} value={form.additional_notes} onChange={(e) => setForm(p => ({ ...p, additional_notes: e.target.value }))} placeholder="Any specific preferences, dietary needs, etc." />
      </Field>
    </div>
  )
}

// ─── Owner Form ──────────────────────────────────────────────────────────────
function OwnerForm({ form, setForm }: { form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>> }) {
  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full Name" required>
          <input className={INPUT_CLASS} value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Vikram Tomar" />
        </Field>
        <Field label="Mobile Number" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">+91</span>
            <input className={cn(INPUT_CLASS, 'pl-12')} value={form.mobile} onChange={(e) => setForm(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="9876543210" maxLength={10} />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Email Address">
          <input type="email" className={INPUT_CLASS} value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="owner@example.com" />
        </Field>
        <Field label="Date of Birth">
          <input type="date" className={INPUT_CLASS} value={form.dob} onChange={(e) => setForm(p => ({ ...p, dob: e.target.value }))} max={new Date().toISOString().split('T')[0]} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Gender">
          <select className={SELECT_CLASS} value={form.gender} onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Years of Experience">
          <input type="number" className={INPUT_CLASS} value={form.experience_years} onChange={(e) => setForm(p => ({ ...p, experience_years: e.target.value }))} placeholder="5" min="0" max="50" />
        </Field>
      </div>

      <Field label="Property Types" required>
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          {PROPERTY_TYPE_OPTIONS.map(pt => (
            <ToggleChip key={pt.value} label={pt.label} active={form.property_types.includes(pt.value)}
              onClick={() => setForm(p => ({ ...p, property_types: toggle(p.property_types, pt.value) }))} />
          ))}
        </div>
      </Field>

      <Field label="Operating Cities" required>
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          {CITY_OPTIONS.map(c => (
            <ToggleChip key={c} label={c} active={form.operating_cities.includes(c)}
              onClick={() => setForm(p => ({ ...p, operating_cities: toggle(p.operating_cities, c) }))} />
          ))}
        </div>
        {form.operating_cities.length > 0 && (
          <p className="text-xs text-emerald-600 font-semibold mt-1">✓ {form.operating_cities.length} cities selected</p>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Approx. Total Beds" required>
          <input type="number" className={INPUT_CLASS} value={form.total_beds_approx} onChange={(e) => setForm(p => ({ ...p, total_beds_approx: e.target.value }))} placeholder="50" min="1" />
        </Field>
        <Field label="PAN Number">
          <input className={INPUT_CLASS} value={form.pan_number} onChange={(e) => setForm(p => ({ ...p, pan_number: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" maxLength={10} />
        </Field>
      </div>

      <Field label="GST Number">
        <input className={INPUT_CLASS} value={form.gst_number} onChange={(e) => setForm(p => ({ ...p, gst_number: e.target.value.toUpperCase() }))} placeholder="22ABCDE1234F1Z5 (Optional)" maxLength={15} />
      </Field>

      <Field label="Additional Notes">
        <textarea className={cn(INPUT_CLASS, 'resize-none h-20')} value={form.additional_notes} onChange={(e) => setForm(p => ({ ...p, additional_notes: e.target.value }))} placeholder="Tell tenants about your properties, facilities, rules..." />
      </Field>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CreateProfilePage() {
  const [profileType, setProfileType] = useState<ProfileType>(null)
  const [step, setStep] = useState<Step>('choose')
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdProfile, setCreatedProfile] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload: Record<string, any> = {
        type: profileType,
        full_name: form.full_name,
        mobile: form.mobile,
        email: form.email,
        dob: form.dob,
        gender: form.gender,
        additional_notes: form.additional_notes,
      }

      if (profileType === 'tenant') {
        if (!form.current_city) throw new Error('Please select your current city')
        if (form.preferred_cities.length === 0) throw new Error('Please select at least one preferred city')
        if (!form.budget_min || !form.budget_max) throw new Error('Please enter your budget range')
        Object.assign(payload, {
          profession: form.profession,
          current_city: form.current_city,
          preferred_cities: form.preferred_cities,
          budget_min_paise: Number(form.budget_min) * 100,
          budget_max_paise: Number(form.budget_max) * 100,
          required_amenities: form.required_amenities,
          preferred_room_type: form.preferred_room_type,
          move_in_date: form.move_in_date,
        })
      } else {
        if (form.property_types.length === 0) throw new Error('Please select at least one property type')
        if (form.operating_cities.length === 0) throw new Error('Please select at least one operating city')
        if (!form.total_beds_approx) throw new Error('Please enter approximate number of beds')
        Object.assign(payload, {
          operating_cities: form.operating_cities,
          property_types: form.property_types,
          total_beds_approx: Number(form.total_beds_approx),
          experience_years: Number(form.experience_years) || 0,
          pan_number: form.pan_number,
          gst_number: form.gst_number,
        })
      }

      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create profile')

      setCreatedProfile(data)
      // Save to localStorage for cross-platform access
      try {
        localStorage.setItem('pgsetu_profile_id', data.profile_id)
        localStorage.setItem('pgsetu_profile_type', profileType!)
        localStorage.setItem('pgsetu_profile_mobile', form.mobile)
        localStorage.setItem('pgsetu_profile_data', JSON.stringify(data.profile))
      } catch {}

      setStep('success')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (createdProfile?.profile_id) {
      navigator.clipboard.writeText(createdProfile.profile_id).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  // ─── Step: Choose Profile Type ──────────────────────────────────────────
  if (step === 'choose') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col">
        {/* Navbar */}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center">
                <Building2 className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-base font-black text-slate-900 tracking-tight">PG-Setu</span>
            </Link>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-2xl w-full space-y-8">
            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 rounded-full text-emerald-700 text-xs font-bold">
                <Star className="w-3 h-3" /> Free Profile — No Login Required
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Create Your PG-Setu Profile
              </h1>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Get a unique Profile ID and connect with the right people. Tenant profiles browse PGs, Owner profiles discover tenants.
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Tenant Card */}
              <button
                onClick={() => { setProfileType('tenant'); setStep('form') }}
                className="group relative bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-3xl p-7 text-left transition-all hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-4 transition">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 rounded-full text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">
                    Tenant Profile <span className="font-mono">TN...</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">I am Looking for PG</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Find the perfect PG, hostel, or flat. Set your budget, preferred cities, and required amenities. Owners will reach out to you.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
                  Create Tenant Profile <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </button>

              {/* Owner Card */}
              <button
                onClick={() => { setProfileType('owner'); setStep('form') }}
                className="group relative bg-white border-2 border-slate-200 hover:border-amber-500 rounded-3xl p-7 text-left transition-all hover:shadow-xl hover:shadow-amber-500/10 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center mb-4 transition">
                  <Home className="w-7 h-7 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 rounded-full text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">
                    Owner Profile <span className="font-mono">OW...</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900">I am a PG Owner</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    List your PG, hostel, or flat. Browse verified tenants looking for accommodation in your city. Fill beds faster.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600">
                  Create Owner Profile <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </button>
            </div>

            {/* Info strip */}
            <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-500">
              {['No login required', 'Mobile as your identity', 'Unique Profile ID assigned', 'Use everywhere on PG-Setu'].map(item => (
                <span key={item} className="flex items-center gap-1">{item}</span>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ─── Step: Success ──────────────────────────────────────────────────────
  if (step === 'success' && createdProfile) {
    const isTenant = profileType === 'tenant'
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full border-4 border-emerald-200 mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-900">Profile Created!</h1>
            <p className="text-slate-500 mt-2 text-sm">
              Your {isTenant ? 'Tenant' : 'PG Owner'} profile has been registered on PG-Setu
            </p>
          </div>

          {/* Profile ID card */}
          <div className="bg-white rounded-3xl border-2 border-emerald-200 p-6 shadow-xl space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Unique Profile ID</p>
            <div className="flex items-center justify-center gap-3">
              <span className={cn(
                'text-4xl font-black font-mono tracking-widest',
                isTenant ? 'text-blue-700' : 'text-amber-700'
              )}>
                {createdProfile.profile_id}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition"
                title="Copy ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Save this ID — use it to access your profile anywhere on PG-Setu using your mobile number
            </p>
          </div>

          {/* What happens next */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 text-left space-y-3">
            <p className="text-sm font-bold text-slate-800">What happens next?</p>
            {isTenant ? (
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> PG owners in your preferred cities can now see your requirements</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Browse PG listings on the homepage that match your preferences</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Owners will contact you on mobile: {form.mobile}</li>
              </ul>
            ) : (
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Tenants searching in your operating cities can now find your profile</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> View tenants looking for accommodation on your dashboard</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">✓</span> Onboard your property for full ERP management via the admin panel</li>
              </ul>
            )}
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Browse PG Listings
            </Link>
            <Link
              href={'/my-profile?mobile=' + form.mobile}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              View My Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step: Form ─────────────────────────────────────────────────────────
  const isTenant = profileType === 'tenant'
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-black text-slate-900 tracking-tight">PG-Setu</span>
          </Link>
          <button
            onClick={() => { setStep('choose'); setProfileType(null); setError('') }}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Change Type
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className={cn(
            'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold',
            isTenant ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
          )}>
            {isTenant ? <Users className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
            {isTenant ? 'Tenant Profile Registration' : 'PG Owner Profile Registration'}
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {isTenant ? 'Tell us what you are looking for' : 'Register as a PG Owner'}
          </h1>
          <p className="text-sm text-slate-500">
            {isTenant
              ? 'Your profile helps owners find you. Your mobile number is your unique identity.'
              : 'Your profile helps tenants find your PG. You will get a unique OW... ID.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {isTenant ? (
            <TenantForm form={form} setForm={setForm} />
          ) : (
            <OwnerForm form={form} setForm={setForm} />
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading || !form.full_name || !form.mobile}
              className={cn(
                'w-full py-3.5 px-6 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-lg disabled:opacity-50',
                isTenant
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/20'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20'
              )}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating Profile...' : `Create ${isTenant ? 'Tenant' : 'Owner'} Profile →`}
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">
              <Shield className="w-3 h-3 inline mr-1" />
              Your mobile number is never shared publicly. Profile can be updated anytime.
            </p>
          </div>
        </form>
      </main>
    </div>
  )
}