'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Receipt,
  CreditCard,
  BedDouble,
  Users,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Sparkles,
  Check,
  X,
  HelpCircle,
  Clock,
  IndianRupee,
  Smartphone,
  PhoneCall,
  Sliders,
  ChevronDown,
  ChevronUp,
  Star,
  Layers,
} from 'lucide-react'
import { MarketplaceNavbar } from '@/components/marketplace/marketplace-navbar'
import { MarketplaceFooter } from '@/components/marketplace/marketplace-footer'
import { ListPropertyModal } from '@/components/marketplace/list-property-modal'
import { useWebsiteContent } from '@/context/website-content-context'

const ERP_MODULES = [
  {
    id: 'billing',
    name: '1-Click Monthly Billing',
    icon: Receipt,
    badge: 'Automated',
    headline: 'Generate 100+ Monthly Invoices in Under 30 Seconds',
    description:
      'Eliminate manual bill writing and calculator errors. PG-SETU automatically detects assigned beds, applies room rents, factors in electricity consumption, and creates official itemized tax invoices.',
    benefits: [
      'Automated invoice generation for all active residents simultaneously',
      'No duplicate billing: Smart checks skip residents with pre-existing bills',
      'Instant sync with each resident’s online passbook and digital ledger',
      'Detailed breakdown: Rent, maintenance, food charges, and amenities',
    ],
    previewMetrics: [
      { label: 'Time Saved', val: '95%' },
      { label: 'Calculation Accuracy', val: '100%' },
      { label: 'Invoices / Minute', val: '500+' },
    ],
  },
  {
    id: 'electricity',
    name: 'Electricity Sub-Meters',
    icon: Zap,
    badge: 'Dispute Free',
    headline: 'Live Digital Meter Readings & Instant Resident Split',
    description:
      'The #1 cause of tenant disputes is unfair electricity charges. PG-SETU allows managers to enter meter readings per room and automatically splits units according to exact days occupied.',
    benefits: [
      'Room-level sub-meter tracking with live tariff calculations',
      'Automatic fair split between room residents based on occupancy duration',
      'Direct ledger debit: Residents see exact meter before & after units',
      'Historical reading logs with photos for 100% tenant verification',
    ],
    previewMetrics: [
      { label: 'Disputes Reduced', val: '98%' },
      { label: 'Units Reconciled', val: 'Live' },
      { label: 'Power Cost Recovered', val: '100%' },
    ],
  },
  {
    id: 'passbook',
    name: 'Tenant Digital Passbook',
    icon: Smartphone,
    badge: 'Zero Apps Needed',
    headline: 'Live Online Passbook Accessible via WhatsApp Link',
    description:
      'Give residents complete visibility into their account. A secure, tokenized passbook link enables residents to check balances, view payment history, and download HRA tax receipts without installing apps.',
    benefits: [
      'One-click tokenized access without remembering usernames or passwords',
      'Real-time running ledger showing every debit, credit, and balance',
      'Instant PDF statement export for official HRA tax filing',
      'Live UPI payment QR code dynamically encoded with exact due balance',
    ],
    previewMetrics: [
      { label: 'Tenant Satisfaction', val: '4.9★' },
      { label: 'Query Calls', val: '-80%' },
      { label: 'HRA Compliance', val: '100%' },
    ],
  },
  {
    id: 'payments',
    name: 'UPI & Daily Closing',
    icon: CreditCard,
    badge: 'Real-time',
    headline: 'Direct Bank UPI Collections & Cash Reconciliation',
    description:
      'Collect rent directly into your current account without 2% payment gateway cut. Generate dynamic UPI QR codes and reconcile cash collections with end-of-day daily closing audits.',
    benefits: [
      'Direct UPI QR: Google Pay, PhonePe, Paytm, CRED & BHIM compatible',
      'Automated professional payment receipts with WhatsApp dispatch',
      'Daily cash drawer closing report with supervisor sign-off',
      'Zero payment gateway fees: 100% of rent reaches your bank account',
    ],
    previewMetrics: [
      { label: 'Gateway Cut', val: '₹0 (0%)' },
      { label: 'Settlement Time', val: 'Instant' },
      { label: 'On-time Rent', val: '94%' },
    ],
  },
  {
    id: 'inventory',
    name: 'Rooms & Beds Matrix',
    icon: BedDouble,
    badge: 'Visual ERP',
    headline: 'Real-Time Campus, Floor, Room & Bed Occupancy',
    description:
      'Visual map of your PG property. Instantly see which beds are occupied, which are vacant, and which are scheduled for cleaning or checkout.',
    benefits: [
      'Multi-building, multi-floor, and room-level hierarchy',
      'Occupancy states: Vacant, Occupied, Maintenance, Reserved',
      'Rapid tenant room transfer with automatic rent balance adjustment',
      '1-click resident check-in with bed allocation and deposit recording',
    ],
    previewMetrics: [
      { label: 'Vacant Bed Fill Rate', val: '3x Faster' },
      { label: 'Bed Inventory Sync', val: 'Real-time' },
      { label: 'Room Transfers', val: '1-Click' },
    ],
  },
  {
    id: 'kyc',
    name: 'Aadhaar KYC Screening',
    icon: ShieldCheck,
    badge: 'Govt. Verified',
    headline: 'Instant Digital Aadhaar KYC & Police Verification Pack',
    description:
      'Safeguard your property and comply with local police tenant verification laws. Collect digital Aadhaar OTP verifications, verify identity photos, and generate downloadable police verification forms.',
    benefits: [
      'Govt. UIDAI-compliant OTP tenant verification',
      'Digital document vault: College ID, Office badge, and Permanent Address',
      'Pre-filled police tenant verification PDF ready for submission',
      'Tamper-proof tenant security audit log',
    ],
    previewMetrics: [
      { label: 'Verification Time', val: '< 2 Mins' },
      { label: 'Paper Forms', val: 'Zero' },
      { label: 'Audit Ready', val: '100%' },
    ],
  },
  {
    id: 'communications',
    name: 'WhatsApp Automation',
    icon: MessageSquare,
    badge: 'High Response',
    headline: 'Automated Rent Reminders, Notices & Payment Slips',
    description:
      'Stop making awkward phone calls asking for rent. PG-SETU dispatches polite, official WhatsApp messages with invoice links, due dates, and direct payment buttons.',
    benefits: [
      'Automated friendly rent reminders 3 days before the 1st of the month',
      'Urgent overdue balance notices on the 5th and 10th',
      'Broadcast announcements for food menus, maintenance, and festival events',
      'Two-way WhatsApp communication without saving contacts in personal phones',
    ],
    previewMetrics: [
      { label: 'Collection Speed', val: '+40%' },
      { label: 'Reminder Read Rate', val: '98%' },
      { label: 'Late Defaulters', val: '-75%' },
    ],
  },
]

const COMPARISON_DATA = [
  {
    feature: 'Monthly Rent Invoicing',
    paper: 'Manual diary calculation (15+ hours)',
    accounting: 'Complex accounting software setup',
    pgSetu: '1-Click bulk automated billing (30 seconds)',
  },
  {
    feature: 'Electricity Sub-Meter Split',
    paper: 'Paper chits, constant tenant arguments',
    accounting: 'Not supported (requires Excel sheets)',
    pgSetu: 'Automatic occupancy-based sub-meter split in app',
  },
  {
    feature: 'Tenant Balance Visibility',
    paper: 'Tenants constantly ask "how much is due?"',
    accounting: 'No tenant-facing portal or passbook',
    pgSetu: 'Live 24/7 online passbook via WhatsApp link',
  },
  {
    feature: 'UPI Rent Payment & QR',
    paper: 'Personal UPI screenshots sent to WhatsApp',
    accounting: 'Separate manual reconciliation',
    pgSetu: 'Pre-filled dynamic UPI QR + automated receipts',
  },
  {
    feature: 'Payment Collection Fee',
    paper: '0% (but unorganized cash handling)',
    accounting: '2% to 3% gateway deductions',
    pgSetu: '0% direct bank account UPI settlement',
  },
  {
    feature: 'Tenant Police Verification',
    paper: 'Physical paper photocopies lost in drawers',
    accounting: 'Not supported',
    pgSetu: 'Govt. Aadhaar KYC verification + 1-click PDF pack',
  },
  {
    feature: 'Daily Cash Closing',
    paper: 'Cash box discrepancies, no audit trail',
    accounting: 'End-of-month manual tally',
    pgSetu: 'Daily closing audit with staff accountability',
  },
]

const FAQS = [
  {
    q: 'Do my residents need to install an app from Play Store or App Store?',
    a: 'No! Residents can access their Live Passbook, invoices, and payment QR code directly through any mobile browser using a secure tokenized WhatsApp link. No apps to download, no passwords to remember.',
  },
  {
    q: 'Can I manage multiple PG buildings or branches under one account?',
    a: 'Yes. PG-SETU is built for multi-property operations. You can switch between properties (e.g. Bangalore Campus, Gurgaon Branch) in one click with isolated ledgers and staff permissions.',
  },
  {
    q: 'How does electricity sub-meter calculation work?',
    a: 'You simply record the meter reading (e.g. 1,420 kWh to 1,510 kWh). The system automatically calculates the 90 units consumed, applies your pre-configured electricity rate, and splits the bill among the room residents according to their active days in the billing cycle.',
  },
  {
    q: 'Does PG-SETU take any percentage commission from my rent payments?',
    a: 'Zero! 100% of your rent payments go directly into your own bank account via direct UPI. We do not charge a 2% or 3% transaction fee like typical payment aggregators.',
  },
  {
    q: 'Can my managers and accountants have restricted access?',
    a: 'Yes. Role-based access control (RBAC) allows you to define roles such as Owner, Property Manager, Accountant, and Staff. Front-desk staff cannot see your overall profit/loss or delete transactions.',
  },
  {
    q: 'Is my financial and resident data secure and private?',
    a: 'Absolutely. We utilize enterprise-grade PostgreSQL with isolated tenant schemas, row-level security (RLS), and encrypted backups. Your tenant contacts and revenue data are 100% private to your organization.',
  },
]

export default function ErpSoftwareShowcasePage() {
  const { content } = useWebsiteContent()
  const sw = content?.softwarePage
  const modulesList = sw?.modules && sw.modules.length > 0 ? sw.modules : ERP_MODULES

  const [activeModule, setActiveModule] = useState(modulesList[0]?.id || 'billing')
  const [bedCount, setBedCount] = useState<number>(60)
  const [annualBilling, setAnnualBilling] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [isListModalOpen, setIsListModalOpen] = useState(false)

  const selectedModule = modulesList.find((m) => m.id === activeModule) || modulesList[0]

  // ROI calculations based on bed count
  const hoursSaved = Math.round(bedCount * 0.45)
  const rentRecovered = Math.round(bedCount * 650)
  const electricitySaved = Math.round(bedCount * 280)
  const totalAnnualSavings = (rentRecovered + electricitySaved) * 12

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#17211B] flex flex-col font-sans selection:bg-[#DCFCE7] selection:text-[#14532D] relative">
      {/* 1. Navigation Header */}
      <MarketplaceNavbar
        onOpenListModal={() => setIsListModalOpen(true)}
        savedCount={0}
        compareCount={0}
      />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F7FAF7] to-white pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-gray-200/70">
          <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center">
            <div className="h-[500px] w-full max-w-7xl bg-radial from-[#DCFCE7]/60 via-transparent to-transparent blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#16A34A]/25 bg-[#DCFCE7]/70 px-4 py-1.5 text-xs font-bold text-[#14532D] shadow-2xs">
                  <Sparkles className="h-4 w-4 text-[#16A34A]" />
                  <span>{sw?.badge || 'India’s Most Powerful Property ERP for PGs & Hostels'}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-[#F59E0B]">PRO Edition</span>
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-tight text-[#14532D] sm:text-5xl lg:text-6xl leading-tight">
                {sw?.heroHeadline || 'Automate Rent, Electricity & Tenants on One Unified ERP System'}
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-[#647067] leading-relaxed">
                {sw?.heroSubtitle ||
                  'Say goodbye to paper registers, lost electricity chits, and late rent excuses. PG-SETU ERP manages your entire property portfolio with 1-click bulk invoicing, live digital passbooks, direct UPI QR collections, and Govt. Aadhaar KYC.'}
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] px-7 py-3.5 text-sm font-extrabold text-white shadow-lg hover:opacity-95 active:scale-98 transition"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm font-bold text-[#17211B] shadow-xs hover:bg-gray-50 active:scale-98 transition"
                >
                  <Building2 className="h-4 w-4 text-[#16A34A]" />
                  <span>Explore Live Demo Dashboard</span>
                </Link>
              </div>

              <p className="mt-3 text-xs text-[#647067]">
                ✓ No credit card required • Instant setup in 5 minutes • 100% Free migration support
              </p>
            </div>

            {/* Stitch-Designed ERP Dashboard UI Presentation */}
            <div className="mx-auto mt-14 max-w-6xl">
              <div className="relative overflow-hidden rounded-3xl border border-gray-200/90 bg-white shadow-2xl shadow-gray-300/40 ring-1 ring-black/5">
                {/* Browser-like window header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-[#F7FAF7] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-semibold text-gray-500">
                      https://app.pgsetu.com/dashboard
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#14532D]">
                    <ShieldCheck className="h-3 w-3 text-[#16A34A]" />
                    <span>Live Connected • 100% Data Isolation</span>
                  </div>
                </div>

                {/* Dashboard Image / Visual Showcase */}
                <div className="relative aspect-16/9 w-full bg-slate-900 overflow-hidden">
                  <img
                    src="https://lh3.googleusercontent.com/aida/AEtjO1WR7dqPvUyUqT2v97mVtjp9_Dyf_rid44iGVevFmqcelmkW_iTA8YBLnAhbXEH_2wRXU03lNN-10SA1yutza4tHjqG7Qzeo5Lx5xImVgnNM8SdVCpP4tgrXA8gtsfWCA_deBDwl8o10e_u-WaBkeIeuoIIoxIpHFBOg8_0pG3g_FDhzM01Z8X3IWswOXoUzlxXfqYoeqkdxxuZu4zryniSHhR0AdMnFgrrHgsCYn7jdhX07RWk5ubZdYlc"
                    alt="PG-SETU ERP Dashboard UI"
                    className="h-full w-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Highlight Badge */}
                  <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-md border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#14532D] text-white font-bold">
                        <BarChart3 className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#17211B]">
                          Live Operational Command Center
                        </h4>
                        <p className="text-xs text-[#647067]">
                          Expected vs Collected progress, outstanding resident tracker & sub-meter audits.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/login"
                      className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
                    >
                      <span>Open ERP Portal</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Interactive ERP Module Deep Dive */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
                <Layers className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>Feature Architecture</span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-[#14532D]">
                Everything You Need to Run 1 to 50+ PG Properties
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-[#647067]">
                Built from ground up specifically for the operational realities of Indian PGs, student hostels, and co-living operators.
              </p>
            </div>

            {/* Horizontal Module Selector Tabs */}
            <div className="mt-12 flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4">
              {ERP_MODULES.map((m) => {
                const Icon = m.icon
                const isActive = activeModule === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveModule(m.id)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#14532D] text-white shadow-md'
                        : 'bg-gray-100 text-[#647067] hover:bg-gray-200 hover:text-[#17211B]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{m.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Selected Module Detail Showcase Card */}
            <div className="mt-6 rounded-3xl border border-gray-200 bg-[#F7FAF7] p-6 sm:p-10 shadow-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Detail Content */}
                <div className="lg:col-span-7 space-y-4">
                  <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold text-[#F59E0B]">
                    ★ {selectedModule.badge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#14532D]">
                    {selectedModule.headline}
                  </h3>
                  <p className="text-sm sm:text-base text-[#647067] leading-relaxed">
                    {selectedModule.description}
                  </p>

                  <div className="pt-3 space-y-2.5">
                    {selectedModule.benefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-[#17211B]">
                        <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#14532D] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#16A34A] transition"
                    >
                      <span>Try {selectedModule.name} Free</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Right Metric Cards */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                      Performance Impact
                    </h4>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {selectedModule.previewMetrics.map((met, i) => (
                        <div key={i} className="rounded-xl bg-[#DCFCE7]/40 p-3">
                          <span className="text-xl sm:text-2xl font-black text-[#14532D] block">
                            {met.val}
                          </span>
                          <span className="text-[10px] font-semibold text-[#647067] mt-1 block">
                            {met.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-xs text-[#14532D]">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <Sparkles className="h-4 w-4 text-[#16A34A]" />
                      <span>Zero Friction Adoption</span>
                    </div>
                    <p className="text-[#647067] leading-relaxed">
                      All modules seamlessly sync with your tenant list and the public PGSetu marketplace without requiring duplicate data entry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Interactive ROI & Savings Calculator */}
        <section className="bg-[#F7FAF7] py-16 sm:py-24 border-y border-gray-200/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
                <IndianRupee className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>Financial Impact Calculator</span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-[#14532D]">
                How Much Money & Time Will You Save Every Month?
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#647067]">
                Drag the slider below to match the capacity of your PG property and calculate your annual return.
              </p>
            </div>

            {/* Calculator Card */}
            <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-gray-200/90 bg-white p-6 sm:p-10 shadow-xl">
              {/* Bed Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#17211B]">
                    How many total beds do you operate?
                  </span>
                  <span className="rounded-xl bg-[#14532D] px-4 py-1.5 text-base font-extrabold text-white">
                    {bedCount} Beds
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={bedCount}
                  onChange={(e) => setBedCount(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#16A34A]"
                />
                <div className="flex justify-between text-[11px] text-gray-400 font-semibold mt-1">
                  <span>10 Beds</span>
                  <span>100 Beds</span>
                  <span>200 Beds</span>
                  <span>300+ Beds</span>
                </div>
              </div>

              {/* Impact Breakdown Grid */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                <div className="rounded-2xl bg-[#F7FAF7] p-5 text-center border border-gray-200">
                  <Clock className="h-6 w-6 text-[#16A34A] mx-auto mb-2" />
                  <span className="text-2xl sm:text-3xl font-black text-[#14532D]">{hoursSaved} Hours</span>
                  <p className="text-xs font-semibold text-[#647067] mt-1">Billing & Math Time Saved / Mo</p>
                </div>

                <div className="rounded-2xl bg-[#F7FAF7] p-5 text-center border border-gray-200">
                  <Receipt className="h-6 w-6 text-[#16A34A] mx-auto mb-2" />
                  <span className="text-2xl sm:text-3xl font-black text-[#14532D]">
                    ₹{rentRecovered.toLocaleString('en-IN')}
                  </span>
                  <p className="text-xs font-semibold text-[#647067] mt-1">Uncollected Dues Recovered / Mo</p>
                </div>

                <div className="rounded-2xl bg-[#F7FAF7] p-5 text-center border border-gray-200">
                  <Zap className="h-6 w-6 text-[#16A34A] mx-auto mb-2" />
                  <span className="text-2xl sm:text-3xl font-black text-[#14532D]">
                    ₹{electricitySaved.toLocaleString('en-IN')}
                  </span>
                  <p className="text-xs font-semibold text-[#647067] mt-1">Sub-Meter Leakage Stopped / Mo</p>
                </div>
              </div>

              {/* Total Annual Value Bar */}
              <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#14532D] to-[#16A34A] p-6 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-[#DCFCE7]">
                    Total Estimated Annual Bottom-Line Impact
                  </span>
                  <p className="text-3xl sm:text-4xl font-black mt-1">
                    ₹{totalAnnualSavings.toLocaleString('en-IN')} / year
                  </p>
                </div>

                <Link
                  href="/register"
                  className="rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-extrabold text-[#14532D] shadow-lg hover:bg-gray-100 transition whitespace-nowrap"
                >
                  Start Saving Today →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Feature Comparison Table */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#14532D]">
                Why Old Tools Fail & PG-SETU Wins
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base text-[#647067]">
                Compare the manual way vs traditional software vs the tailored PG-SETU Property ERP.
              </p>
            </div>

            <div className="mt-12 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="p-4 sm:p-5 font-bold text-gray-500 uppercase text-[11px] w-1/4">
                      Core Operations
                    </th>
                    <th className="p-4 sm:p-5 font-bold text-gray-400 uppercase text-[11px] w-1/4">
                      Pen, Paper & Diaries
                    </th>
                    <th className="p-4 sm:p-5 font-bold text-gray-400 uppercase text-[11px] w-1/4">
                      Generic Accounting Apps
                    </th>
                    <th className="p-4 sm:p-5 font-bold text-[#14532D] uppercase text-[11px] w-1/4 bg-[#DCFCE7]/40">
                      PG-SETU Property ERP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {COMPARISON_DATA.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/40 transition">
                      <td className="p-4 sm:p-5 font-bold text-[#17211B]">{row.feature}</td>
                      <td className="p-4 sm:p-5 text-gray-500">{row.paper}</td>
                      <td className="p-4 sm:p-5 text-gray-500">{row.accounting}</td>
                      <td className="p-4 sm:p-5 font-bold text-[#14532D] bg-[#DCFCE7]/20">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-4 w-4 text-[#16A34A] shrink-0" />
                          <span>{row.pgSetu}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 6. Transparent Pricing Plans */}
        <section className="bg-[#F7FAF7] py-16 sm:py-24 border-t border-gray-200/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#14532D]">
                <Sparkles className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>Simple Transparent Pricing</span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-[#14532D]">
                Honest Plans That Grow With Your PG Business
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#647067]">
                All plans include automated bulk billing, tenant passbooks, sub-meter splitting, and WhatsApp integration.
              </p>

              {/* Billing Toggle */}
              <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white p-1.5 shadow-2xs">
                <button
                  onClick={() => setAnnualBilling(false)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    !annualBilling ? 'bg-[#14532D] text-white shadow-xs' : 'text-[#647067]'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  onClick={() => setAnnualBilling(true)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    annualBilling ? 'bg-[#14532D] text-white shadow-xs' : 'text-[#647067]'
                  }`}
                >
                  Annual (Save 20% + 2 Months Free)
                </button>
              </div>
            </div>

            {/* 3 Pricing Cards */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Starter Plan */}
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#17211B]">Starter PG</h3>
                  <p className="text-xs text-[#647067] mt-1">For single small hostels & independent PGs</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#14532D]">
                      {annualBilling ? '₹799' : '₹999'}
                    </span>
                    <span className="text-xs text-gray-500">/ month</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs font-semibold text-gray-700">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Up to 25 Beds managed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>1-Click Bulk Monthly Invoicing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Tenant Passbook via WhatsApp Link</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Electricity Sub-Meter Readings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Direct UPI QR Collections</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 block w-full rounded-xl border border-gray-300 py-3 text-center text-xs font-bold text-[#17211B] hover:bg-gray-50 transition"
                >
                  Start 14-Day Trial
                </Link>
              </div>

              {/* Growth Plan (Most Popular) */}
              <div className="relative rounded-3xl border-2 border-[#16A34A] bg-white p-8 shadow-xl flex flex-col justify-between ring-4 ring-[#DCFCE7]">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#14532D] to-[#16A34A] px-4 py-1 text-[11px] font-extrabold text-white shadow-md">
                  ★ MOST POPULAR
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#14532D]">Growth Operator</h3>
                  <p className="text-xs text-[#647067] mt-1">For busy multi-floor PGs & student hostels</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-[#14532D]">
                      {annualBilling ? '₹1,999' : '₹2,499'}
                    </span>
                    <span className="text-xs text-gray-500">/ month</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs font-semibold text-gray-700">
                    <li className="flex items-center gap-2 font-bold text-[#14532D]">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Up to 100 Beds managed</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>All Starter Features Included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Govt. Aadhaar KYC Verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Automated WhatsApp Reminders</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Daily Closing & Expense Audits</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Priority Phone & WhatsApp Support</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 block w-full rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-center text-xs font-extrabold text-white shadow-md hover:opacity-95 transition"
                >
                  Start Free 14-Day Trial
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#17211B]">Multi-Campus Enterprise</h3>
                  <p className="text-xs text-[#647067] mt-1">For multi-branch co-living brands & chains</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#14532D]">
                      {annualBilling ? '₹4,499' : '₹5,499'}
                    </span>
                    <span className="text-xs text-gray-500">/ month</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-xs font-semibold text-gray-700">
                    <li className="flex items-center gap-2 font-bold text-[#14532D]">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Unlimited Beds & Campuses</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Multi-Branch Master Analytics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Role-Based Permissions (Manager/Staff)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Custom WhatsApp Sender ID</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#16A34A]" />
                      <span>Dedicated Account Success Manager</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 block w-full rounded-xl border border-gray-300 py-3 text-center text-xs font-bold text-[#17211B] hover:bg-gray-50 transition"
                >
                  Contact Enterprise Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Real Testimonials from PG Owners */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold text-[#F59E0B]">
                <Star className="h-3.5 w-3.5 fill-[#F59E0B]" />
                <span>Loved by 1,200+ PG Owners</span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-4xl font-extrabold text-[#14532D]">
                Real Stories From Indian PG Operators
              </h2>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    'Electricity disputes were causing 2-3 tenants to leave every quarter. With PG-SETU’s digital sub-meter split, residents see the start and end readings right in their passbook. Zero arguments now.',
                  name: 'Rajesh Hegde',
                  property: 'Olive Co-living (84 Beds)',
                  city: 'Koramangala, Bangalore',
                  rating: 5,
                },
                {
                  quote:
                    'Generating bills for 120 students used to take 2 full days of calculator entries. Now I click "Generate Invoices" on the 1st of the month, and in 20 seconds all 120 bills are live with WhatsApp links.',
                  name: 'Sunil Choudhary',
                  property: 'Cyber View Hostels (120 Beds)',
                  city: 'DLF Phase 3, Gurgaon',
                  rating: 5,
                },
                {
                  quote:
                    'The daily cash closing feature stopped cash leakage from our reception staff completely. Plus, having our property listed directly on the PGSetu marketplace keeps our occupancy at 98%.',
                  name: 'Mrs. Rekha Sharma',
                  property: 'Aura Bloom Women’s PG (65 Beds)',
                  city: 'Sector 62, Noida',
                  rating: 5,
                },
              ].map((test, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-gray-200 bg-[#F7FAF7] p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-[#F59E0B] mb-3">
                      {[...Array(test.rating)].map((_, idx) => (
                        <Star key={idx} className="h-4 w-4 fill-[#F59E0B]" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed italic">
                      &ldquo;{test.quote}&rdquo;
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-bold text-[#17211B]">{test.name}</h4>
                    <p className="text-[11px] text-[#16A34A] font-semibold">{test.property}</p>
                    <p className="text-[10px] text-gray-400">{test.city}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Interactive FAQ Accordion */}
        <section className="bg-[#F7FAF7] py-16 sm:py-24 border-t border-gray-200/70">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#14532D]">
                Frequently Asked Questions
              </h2>
              <p className="mt-2 text-sm text-[#647067]">
                Clear answers to common questions about PG-SETU ERP software.
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-2xs"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-[#17211B] hover:bg-gray-50/80 transition"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-[#16A34A] shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="border-t border-gray-100 p-5 pt-3 text-xs sm:text-sm text-[#647067] leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 9. Final High-Conversion CTA Banner */}
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-[#14532D] via-[#166534] to-[#14532D] p-8 sm:p-14 text-white text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-3xl mx-auto">
                <span className="rounded-full bg-[#DCFCE7]/20 px-3.5 py-1 text-xs font-bold text-[#DCFCE7]">
                  Instant Setup • Free Data Migration
                </span>
                <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold leading-tight">
                  Transform Your PG Into an Automated Money Machine
                </h2>
                <p className="mt-4 text-sm sm:text-base text-gray-200 max-w-xl mx-auto">
                  Join hundreds of forward-thinking PG operators across Bangalore, Gurgaon, Noida, and Pune who run stress-free properties with PG-SETU.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="rounded-xl bg-white px-8 py-3.5 text-sm font-extrabold text-[#14532D] shadow-lg hover:bg-gray-100 active:scale-98 transition"
                  >
                    Start 14-Day Free Trial
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl border border-white/40 bg-white/10 px-8 py-3.5 text-sm font-bold text-white backdrop-blur-xs hover:bg-white/20 transition"
                  >
                    Log In to Existing PG
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 10. Footer */}
      <MarketplaceFooter />

      {/* Modal if user clicks list property */}
      <ListPropertyModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
      />
    </div>
  )
}
