import React from "react";
import { MarketplaceNavbar } from "@/components/marketplace/marketplace-navbar";
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer";

export const metadata = {
  title: 'Refund & Cancellation Policy | PG-SETU',
  description: 'Refund and cancellation policy for PG-SETU ERP SaaS subscriptions and marketplace.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceNavbar />
      
      <main className="flex-grow py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-green-900 mb-4">Refund & Cancellation Policy</h1>
            <p className="text-lg text-gray-600">Last updated: September 24, 2026</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8 sm:p-10 space-y-12">
              
              {/* 1. Overview */}
              <section>
                <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm mr-3">1</span>
                  Overview
                </h2>
                <div className="prose prose-green max-w-none text-gray-600">
                  <p>
                    PGSetu PropTech Technologies Pvt. Ltd. (brand: PGSetu / PG-SETU) offers ERP SaaS subscriptions to PG owners and property managers. Tenants use the platform's rental marketplace and tenant portal completely free of charge.
                  </p>
                  <p className="font-medium text-gray-800">
                    Important: Rent money flows directly between tenant and owner. PGSetu does not process, mediate, or hold rent money at any point.
                  </p>
                </div>
              </section>

              {/* 2. ERP Subscription Refunds */}
              <section>
                <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm mr-3">2</span>
                  ERP Subscription Refunds
                </h2>
                
                <div className="bg-[#DCFCE7] border border-[#16A34A] rounded-xl p-6 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="w-6 h-6 text-[#14532D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-[#14532D]">30-Day Money-Back Guarantee</h3>
                      <p className="text-[#14532D] mt-1">
                        New subscribers can claim a full refund within 30 days of their initial purchase if they are not completely satisfied. Simply email <a href="mailto:vikramtomar0505@gmail.com" className="font-semibold underline">vikramtomar0505@gmail.com</a>. No questions asked.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-gray-600">
                  <p><strong>After 30 days:</strong> We do not offer refunds for the remaining subscription period of your active billing cycle.</p>
                  <p><strong>Annual Plans:</strong> If you cancel an annual plan with documented cause (e.g., persistent technical failures on our end), we will issue a pro-rated refund for the remaining <em>full months</em>. Partial months are not refunded.</p>
                  <p><strong>Monthly Plans:</strong> We do not offer partial-month refunds. You will continue to have access to the platform until the end of your current billing period.</p>
                </div>
              </section>

              {/* 3. Non-Refundable Items */}
              <section>
                <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm mr-3">3</span>
                  Non-Refundable Items
                </h2>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl">
                  <p className="text-amber-900 mb-3 font-medium">The following service fees are strictly non-refundable:</p>
                  <ul className="list-disc pl-5 text-amber-800 space-y-1">
                    <li>Custom onboarding and implementation fees</li>
                    <li>Data migration services</li>
                    <li>White-labelling setup fees</li>
                    <li>API access activation fees</li>
                  </ul>
                </div>
              </section>

              {/* 4. How to Request */}
              <section>
                <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm mr-3">4</span>
                  How to Request a Refund
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div className="border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-2">1. Send an Email</h3>
                    <p className="text-gray-600 text-sm">
                      Email: <a href="mailto:vikramtomar0505@gmail.com" className="text-green-600 font-medium">vikramtomar0505@gmail.com</a><br/>
                      Subject: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">Refund Request - [Your Org Name]</span>
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      Please include your account email, subscription start date, and reason for the request.
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-2">2. Processing Timeline</h3>
                    <div className="flex flex-col space-y-2 mt-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                        5-7 business days for eligibility review
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        7-10 business days for bank credit
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 5 & 6. GST & Payments */}
              <section className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-bold text-green-900 mb-3 flex items-center">
                    <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs mr-2">5</span>
                    GST on Refunds
                  </h2>
                  <p className="text-gray-600 text-sm">
                    If GST was charged on your original invoice, the refund will be for the base amount. A GST refund is subject to the subscriber successfully filing a GST credit note claim in accordance with Indian tax laws.
                  </p>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-green-900 mb-3 flex items-center">
                    <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs mr-2">6</span>
                    Payment Method
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Refunds will be issued to the original payment method (UPI, credit card, or bank transfer). If the original payment gateway is no longer available, we will process a bank NEFT/RTGS transfer.
                  </p>
                </div>
              </section>

              {/* 7 & 8. Tenant Side & Marketplace */}
              <section>
                <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center">
                  <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm mr-3">7</span>
                  Tenant-Side Policy & Marketplace
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>Rent Payments:</strong> PGSetu does not mediate rent disputes. If you paid rent to a PG owner via their preferred method, you must contact the owner directly for any refunds or disputes. PGSetu is not liable for rent disputes between tenants and owners.
                  </p>
                  <p>
                    <strong>Marketplace Listing Fees:</strong> <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 inline-flex items-center justify-center text-xs ml-1 mr-1">8</span> Listings on our marketplace are currently free. If premium listing fees are introduced in the future, the associated cancellation policy will be communicated 30 days in advance.
                  </p>
                </div>
              </section>

              {/* 9 & 10. Disputes & Changes */}
              <section>
                <div className="border-t border-gray-200 pt-8 mt-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">9. Dispute Escalation</h3>
                      <p className="text-gray-600 text-sm">
                        If your refund is denied and you disagree with the decision, you may escalate the matter to our Grievance Officer, Vikram Tomar, who will provide a final resolution within a 30-day window.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">10. Changes to Policy</h3>
                      <p className="text-gray-600 text-sm">
                        We reserve the right to modify this refund policy. Any material changes will be communicated to active subscribers via email with at least 15 days advance notice.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
          
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>Company: PGSetu PropTech Technologies Pvt. Ltd.</p>
            <p>Website: staysetu-ruby.vercel.app</p>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
