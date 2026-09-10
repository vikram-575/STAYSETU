'use client'

import React from 'react'
import Link from 'next/link'
import { Building2, ShieldCheck, Mail, Phone, Heart, ExternalLink } from 'lucide-react'

export function MarketplaceFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white text-xs text-[#647067]">
      {/* Upper Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Col 1: Brand info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-[#14532D]">StaySetu</span>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-[#647067]">
              India’s high-trust PG and rental property discovery platform. Connecting tenants directly with genuine property owners with zero brokerage, verified listings, and automated digital rent passbooks.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-[#14532D]">
              <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
              <span>Certified Safe & Zero Brokerage Guaranteed</span>
            </div>
          </div>

          {/* Col 2: Popular Cities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17211B] mb-3">
              Popular Cities
            </h4>
            <ul className="space-y-2">
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">PGs in Bangalore</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">PGs in Gurgaon</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">Flats in Noida</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">Rooms in Delhi</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">PGs in Pune</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">Hostels in Hyderabad</span>
              </li>
            </ul>
          </div>

          {/* Col 3: For Renters */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17211B] mb-3">
              For Renters
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/portal" className="hover:text-[#16A34A] font-medium text-[#17211B]">
                  Tenant Portal & Passbook
                </Link>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">Rent Agreement Maker</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">Electricity Sub-meter Split</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">HRA Rent Receipts</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">Tenant Rights & FAQs</span>
              </li>
            </ul>
          </div>

          {/* Col 4: For PG Owners */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#17211B] mb-3">
              For Owners & Landlords
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/software" className="hover:text-[#16A34A] font-bold text-[#14532D] flex items-center gap-1">
                  <span>PG-SETU ERP Software</span>
                  <span className="rounded-sm bg-[#DCFCE7] px-1 py-0.2 text-[9px] text-[#14532D]">NEW</span>
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#16A34A] font-semibold text-gray-700">
                  Owner ERP Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#16A34A]">
                  Register New Hostel / PG
                </Link>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">Aadhaar KYC Verification</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">Automated Rent Invoicing</span>
              </li>
              <li>
                <span className="hover:text-[#16A34A] cursor-pointer">Daily Closing & Ledger</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-gray-100 bg-[#F7FAF7] py-4">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between px-4 sm:px-6 lg:px-8 gap-2 text-[11px]">
          <p>© 2026 StaySetu PropTech Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-900 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-900 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-900 cursor-pointer">Safety Guidelines</span>
            <span className="hover:text-gray-900 cursor-pointer">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
