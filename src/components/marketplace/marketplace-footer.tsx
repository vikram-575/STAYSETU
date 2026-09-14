'use client'

import React from 'react'
import Link from 'next/link'
import { Building2, ShieldCheck, Mail, Phone, Heart, ExternalLink, MapPin, Clock } from 'lucide-react'
import { useWebsiteContent } from '@/context/website-content-context'

export function MarketplaceFooter() {
  const { content } = useWebsiteContent()
  const footer = content?.footer

  return (
    <footer className="border-t border-gray-200 bg-white text-xs text-[#647067] relative">
      {/* Upper Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          {/* Col 1: Brand info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-[#14532D]">PGSetu</span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-[#647067]">
              {footer?.aboutText ||
                'India’s high-trust PG and rental property discovery platform. Connecting tenants directly with genuine property owners with zero brokerage, verified listings, and automated digital rent passbooks.'}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-[#14532D]">
              <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
              <span>{footer?.guaranteeText || 'Certified Safe & Zero Brokerage Guaranteed'}</span>
            </div>

            {/* Direct Contact Info */}
            <div className="pt-2 space-y-1.5 text-xs">
              {footer?.phone && (
                <div className="flex items-center gap-2 text-[#17211B] font-semibold">
                  <Phone className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>{footer.phone}</span>
                </div>
              )}
              {footer?.email && (
                <div className="flex items-center gap-2 text-[#17211B]">
                  <Mail className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>{footer.email}</span>
                </div>
              )}
              {footer?.address && (
                <div className="flex items-start gap-2 text-xs text-[#647067]">
                  <MapPin className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>{footer.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Popular Cities - Issue 10: Fixed H2 -> H3 heading level */}
          <div>
            <h3 className="text-sm font-semibold text-[#17211B] mb-3.5">
              Popular Cities
            </h3>
            {/* Issue 16: Relaxed spacing with space-y-3 and py-0.5 inline-block for comfortable touch targets */}
            <ul className="space-y-3 text-xs text-[#647067]">
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">PGs in Bangalore</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">PGs in Gurgaon</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">Flats in Noida</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">Rooms in Delhi</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">PGs in Pune</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">Hostels in Hyderabad</span>
              </li>
            </ul>
          </div>

          {/* Col 3: For Renters - Issue 10: Fixed H2 -> H3 */}
          <div>
            <h3 className="text-sm font-semibold text-[#17211B] mb-3.5">
              For Renters
            </h3>
            <ul className="space-y-3 text-xs text-[#647067]">
              <li>
                <Link href="/portal" className="hover:text-[#16A34A] py-0.5 inline-block font-medium text-[#17211B] transition">
                  Tenant Portal & Passbook
                </Link>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">Rent Agreement Maker</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">Electricity Sub-meter Split</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">HRA Rent Receipts</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">Tenant Rights & FAQs</span>
              </li>
            </ul>
          </div>

          {/* Col 4: For PG Owners - Issues 6 & 10: Title Case H3 */}
          <div>
            <h3 className="text-sm font-semibold text-[#17211B] mb-3.5">
              For Owners &amp; Landlords
            </h3>
            <ul className="space-y-3 text-xs text-[#647067]">
              <li>
                <Link href="/software" className="hover:text-[#16A34A] font-bold text-[#14532D] flex items-center gap-1 py-0.5 transition">
                  <span>PG-SETU ERP Software</span>
                  <span className="rounded-full bg-[#DCFCE7] px-1.5 py-0.5 text-xs text-[#14532D]">NEW</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#16A34A] py-0.5 inline-block font-semibold text-gray-700 transition"
                >
                  Owner ERP Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#16A34A] py-0.5 inline-block transition">
                  Register New Hostel / PG
                </Link>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">Aadhaar KYC Verification</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">Automated Rent Invoicing</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] py-0.5 inline-block cursor-pointer transition">Daily Closing & Ledger</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar - Issue 7: Changed text-[11px] to text-xs */}
      <div className="border-t border-gray-100 bg-[#F7FAF7] py-4 pb-24 md:pb-4">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 gap-2 text-xs text-[#647067] text-center sm:text-left">
          <p>{footer?.copyrightText || '© 2026 PGSetu PropTech Technologies Pvt. Ltd. All rights reserved.'}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <span className="hover:text-[#17211B] cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-[#17211B] cursor-pointer transition">Terms of Service</span>
            <span className="hover:text-[#17211B] cursor-pointer transition">Safety Guidelines</span>
            <span className="hover:text-[#17211B] cursor-pointer transition">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
