import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { MarketplaceNavbar } from '@/components/marketplace/marketplace-navbar'
import { MarketplaceFooter } from '@/components/marketplace/marketplace-footer'
import {
  Compass, Building2, KeyRound, ShieldCheck, FileText,
  CreditCard, Search, MapPin, ExternalLink, HelpCircle
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Website Sitemap | PG-SETU',
  description: 'Complete directory of all pages, cities, and services on PG-SETU rental network and ERP platform.',
}

export default function SitemapPage() {
  const sections = [
    {
      title: 'Property Discovery & Marketplace',
      icon: Search,
      links: [
        { label: 'Marketplace Home', href: '/' },
        { label: 'Search All PGs & Hostels', href: '/search' },
        { label: 'PG Finder & Filter', href: '/search-pg' },
        { label: 'Community & Reviews', href: '/community' },
      ],
    },
    {
      title: 'Popular City Directories',
      icon: MapPin,
      links: [
        { label: 'PGs in Bangalore', href: '/search?city=Bangalore' },
        { label: 'PGs in Gurgaon', href: '/search?city=Gurgaon' },
        { label: 'Flats & Rooms in Noida', href: '/search?city=Noida' },
        { label: 'Hostels in Delhi', href: '/search?city=Delhi' },
        { label: 'PGs in Pune', href: '/search?city=Pune' },
        { label: 'Hostels in Hyderabad', href: '/search?city=Hyderabad' },
        { label: 'PGs in Mumbai', href: '/search?city=Mumbai' },
        { label: 'Rentals in Chennai', href: '/search?city=Chennai' },
      ],
    },
    {
      title: 'For PG Owners & Landlords',
      icon: Building2,
      links: [
        { label: 'PG-SETU ERP Software Overview', href: '/software' },
        { label: 'Owner & Staff ERP Login', href: '/login' },
        { label: 'Register New Hostel / PG', href: '/register' },
        { label: 'ERP Subscription Agreement', href: '/erp-terms' },
        { label: 'Aadhaar e-KYC Verification System', href: '/safety#aadhaar-kyc' },
      ],
    },
    {
      title: 'For Tenants & Residents',
      icon: KeyRound,
      links: [
        { label: 'Tenant Portal & Digital Passbook', href: '/portal' },
        { label: 'Tenant Profile & Settings', href: '/my-profile' },
        { label: 'Safety Guidelines for Renters', href: '/safety' },
      ],
    },
    {
      title: 'Legal & Compliance Policies',
      icon: ShieldCheck,
      links: [
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Safety Guidelines & Trust', href: '/safety' },
        { label: 'Refund & Cancellation Policy', href: '/refund-policy' },
        { label: 'Cookie & Tracking Policy', href: '/cookies-policy' },
        { label: 'ERP SaaS Subscription Terms', href: '/erp-terms' },
        { label: 'XML Search Engine Sitemap', href: '/sitemap.xml' },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <MarketplaceNavbar onOpenListModal={() => {}} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 w-full">
        {/* Header Banner */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[#14532D] text-xs font-bold mb-3">
            <Compass className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Platform Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17211B] tracking-tight">
            PG-SETU Sitemap
          </h1>
          <p className="text-sm text-[#647067] mt-2">
            Explore all pages, services, cities, and legal policies available across the PG-SETU platform.
          </p>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, idx) => {
            const Icon = section.icon
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="font-bold text-sm text-[#17211B]">{section.title}</h2>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#647067]">
                    {section.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link
                          href={link.href}
                          className="hover:text-[#16A34A] hover:underline font-medium flex items-center gap-1.5 transition py-0.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  )
}
