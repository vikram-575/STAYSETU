import React from "react";
import { MarketplaceNavbar } from "@/components/marketplace/marketplace-navbar";
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer";

export const metadata = {
  title: 'ERP SaaS Subscription Agreement | PG-SETU',
  description: 'Terms of service and subscription agreement for PG-SETU ERP software.',
};

export default function ERPTermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceNavbar />
      
      <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-[#14532D] mb-4">ERP SaaS Subscription Agreement</h1>
            <p className="text-lg text-gray-600">Effective Date: September 24, 2026</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-gray-700">
            <div className="p-8 sm:p-10 space-y-10">
              
              {/* 1. Parties */}
              <section>
                <h2 className="text-xl font-bold text-[#14532D] mb-3">1. Parties & Definitions</h2>
                <p className="text-sm leading-relaxed">
                  This Agreement is entered into between PGSetu PropTech Technologies Pvt. Ltd. ("PGSetu", "we", "us") and the subscriber ("Subscriber", "you"). "Platform" refers to the PG-SETU ERP software and related services available at staysetu-ruby.vercel.app.
                </p>
              </section>

              {/* 2. License Grant */}
              <section>
                <h2 className="text-xl font-bold text-[#14532D] mb-3">2. License Grant</h2>
                <p className="text-sm leading-relaxed">
                  Subject to your compliance with this Agreement and payment of applicable fees, PGSetu grants you a limited, non-exclusive, non-transferable, revocable license to access and use the PG-SETU ERP software as a Software-as-a-Service (SaaS) solution for your internal business operations.
                </p>
              </section>

              {/* 3. Subscription Plans */}
              <section>
                <h2 className="text-xl font-bold text-[#14532D] mb-4">3. Subscription Plans</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-bold text-gray-900">Starter Plan</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-2">Single property, up to 50 beds.</p>
                    <ul className="text-xs list-disc pl-4 space-y-1 text-gray-600">
                      <li>Resident CRM & Billing</li>
                      <li>KYC Verification</li>
                      <li>Email Support</li>
                    </ul>
                  </div>
                  <div className="border border-[#16A34A] rounded-lg p-4 bg-[#DCFCE7]">
                    <h3 className="font-bold text-[#14532D]">Growth Plan</h3>
                    <p className="text-xs text-green-800 mt-1 mb-2">Up to 5 properties, 300 beds.</p>
                    <ul className="text-xs list-disc pl-4 space-y-1 text-green-800">
                      <li>Everything in Starter</li>
                      <li>WhatsApp Bot Included</li>
                      <li>Email & WhatsApp Support</li>
                    </ul>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-bold text-gray-900">Enterprise Plan</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-2">Unlimited properties & beds.</p>
                    <ul className="text-xs list-disc pl-4 space-y-1 text-gray-600">
                      <li>Custom Integrations</li>
                      <li>Dedicated Account Manager</li>
                      <li>4-Hour Support SLA</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm mt-3 text-gray-500 italic">All plans include: resident CRM, billing, KYC verification, payments tracking, and analytics.</p>
              </section>

              {/* 4 & 5. Permitted & Prohibited Use */}
              <div className="grid md:grid-cols-2 gap-6">
                <section className="bg-green-50 rounded-lg p-5 border border-green-100">
                  <h2 className="text-lg font-bold text-green-800 mb-2">4. Permitted Use</h2>
                  <p className="text-sm text-green-900">
                    You may use the platform solely for managing your own registered PG, hostel, or rental properties that you legally own or operate.
                  </p>
                </section>
                <section className="bg-amber-50 rounded-lg p-5 border border-amber-100">
                  <h2 className="text-lg font-bold text-amber-800 mb-2">5. Prohibited Use</h2>
                  <ul className="text-sm text-amber-900 list-disc pl-4 space-y-1">
                    <li>Reselling or sublicensing access</li>
                    <li>Creating competing products</li>
                    <li>Scraping data or unauthorized API access</li>
                    <li>Using for properties you do not manage</li>
                  </ul>
                </section>
              </div>

              {/* 6 & 7. Data Privacy */}
              <section>
                <h2 className="text-xl font-bold text-[#14532D] mb-3">6. Data Ownership & 7. PGSetu as Data Processor</h2>
                <p className="text-sm leading-relaxed mb-3">
                  The Subscriber retains all ownership rights to the resident data entered into the system. PGSetu acts exclusively as a data processor, not a data controller. As a data processor, PGSetu obligations include:
                </p>
                <ul className="text-sm list-disc pl-5 space-y-1">
                  <li>Processing data only strictly as per the Subscriber's instructions.</li>
                  <li>Implementing appropriate technical and organizational security measures.</li>
                  <li>Not disclosing data to third parties except as legally mandated.</li>
                  <li>Assisting the Subscriber with data subject rights requests.</li>
                  <li>Notifying the Subscriber of any data breaches within 72 hours of discovery.</li>
                </ul>
              </section>

              {/* 8. Uptime SLA */}
              <section className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-2">8. Uptime SLA</h2>
                <p className="text-sm text-gray-700">
                  PGSetu targets a <strong>99.5% monthly uptime</strong>. This excludes scheduled maintenance (notified 48h in advance), force majeure events, and third-party service outages. If downtime exceeds this SLA, you are eligible for 1 day of subscription credit per hour of excess downtime, capped at a maximum of 30 days.
                </p>
              </section>

              {/* 9 & 10. Support and Aadhaar */}
              <section className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-[#14532D] mb-2">9. Support Terms</h2>
                  <p className="text-sm">Response times depend on your plan: Starter (2 business days via Email), Growth (1 business day via Email/WhatsApp), Enterprise (4-hour SLA via Dedicated Account Manager).</p>
                </div>
                
                <div>
                  <h2 className="text-xl font-bold text-[#14532D] mb-2">10. Aadhaar / KYC Data Handling</h2>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    <li>PG owners must obtain explicit consent from residents before initiating Aadhaar e-KYC.</li>
                    <li>Only masked Aadhaar numbers (last 4 digits) are stored in the database.</li>
                    <li>KYC documents are stored encrypted at rest.</li>
                    <li>Compliance with UIDAI regulations is the Subscriber's responsibility; PGSetu provides the software tooling.</li>
                    <li>KYC data is retained for 5 years per regulatory requirements, then securely deleted.</li>
                  </ul>
                </div>
              </section>

              {/* 11 & 12. Fees and IP */}
              <section className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">11. Fees & Payment</h2>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    <li>Billed monthly or annually in advance.</li>
                    <li>Auto-renews unless cancelled 7 days prior.</li>
                    <li>7-day grace period for failed payments before account suspension.</li>
                    <li>30-day period before data deletion post-suspension.</li>
                    <li><strong>GST:</strong> 18% applicable on all subscription fees.</li>
                  </ul>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">12. Intellectual Property</h2>
                  <ul className="text-sm list-disc pl-5 space-y-1">
                    <li>PGSetu retains all IP rights in the ERP software.</li>
                    <li>Subscriber retains all IP rights in their own data.</li>
                    <li>You are granted a license to use PGSetu branding strictly for "Powered by PG-SETU" attribution purposes.</li>
                  </ul>
                </div>
              </section>

              {/* 13 & 14 & 15. Suspension and Termination */}
              <section>
                <h2 className="text-xl font-bold text-[#14532D] mb-3">13. Confidentiality, 14. Suspension & 15. Termination</h2>
                <p className="text-sm mb-2">
                  Both parties agree to maintain confidentiality of proprietary information. PGSetu reserves the right to immediately suspend access for fraudulent use, Aadhaar regulation violations, or non-payment after the grace period.
                </p>
                <p className="text-sm">
                  Subscribers may cancel at any time, maintaining access until the end of the billing period. Upon termination, a data export tool is available for 30 days (CSV/JSON format). <strong>After 30 days, all subscriber data is permanently deleted.</strong>
                </p>
              </section>

              {/* 16. Limitation of Liability */}
              <section className="bg-red-50 border border-red-100 rounded-lg p-5">
                <h2 className="text-lg font-bold text-red-800 mb-2">16. Limitation of Liability</h2>
                <p className="text-sm text-red-900 font-medium uppercase text-xs tracking-wider mb-2">Important Clause</p>
                <p className="text-sm text-red-900">
                  PGSetu's maximum aggregate liability under this agreement is capped at the equivalent of three (3) months of subscription fees paid by you. PGSetu assumes no liability for indirect damages, lost profits, or data loss resulting from the Subscriber's own actions or misconfigurations.
                </p>
              </section>

              {/* 17, 18, 19. Governing Law, Entire Agreement, Contact */}
              <section className="border-t border-gray-200 pt-8 mt-4 text-sm text-gray-600 space-y-4">
                <p><strong>17. Governing Law:</strong> This Agreement is governed by the laws of India. The courts of Mumbai, Maharashtra shall have exclusive jurisdiction over any disputes.</p>
                <p><strong>18. Entire Agreement & Amendments:</strong> This document constitutes the entire agreement. PGSetu may update these terms with reasonable notice to active subscribers.</p>
                <p><strong>19. Contact / Grievance Officer:</strong> Vikram Tomar (<a href="mailto:vikramtomar0505@gmail.com" className="text-[#16A34A] underline">vikramtomar0505@gmail.com</a>)</p>
              </section>

            </div>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
