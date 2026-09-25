import { MarketplaceNavbar } from "@/components/marketplace/marketplace-navbar";
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | PG-SETU",
  description: "Terms and Conditions for using PG-SETU PG rental discovery platform and ERP SaaS services.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "September 24, 2026";

  const tableOfContents = [
    { id: "introduction", title: "1. Introduction & Acceptance" },
    { id: "platform-description", title: "2. Platform Description" },
    { id: "eligibility", title: "3. Eligibility" },
    { id: "account-registration", title: "4. Account Registration & Security" },
    { id: "property-owners", title: "5. For Property Owners & PG Managers" },
    { id: "tenants", title: "6. For Tenants & Residents" },
    { id: "all-users", title: "7. For All Users" },
    { id: "payments", title: "8. Payments & Subscriptions" },
    { id: "aadhaar-kyc", title: "9. Aadhaar e-KYC Special Provisions" },
    { id: "disclaimer", title: "10. Disclaimer of Warranties" },
    { id: "limitation-liability", title: "11. Limitation of Liability" },
    { id: "indemnification", title: "12. Indemnification" },
    { id: "dispute-resolution", title: "13. Dispute Resolution" },
    { id: "governing-law", title: "14. Governing Law" },
    { id: "changes", title: "15. Changes to Terms" },
    { id: "contact", title: "16. Contact & Grievance" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceNavbar />
      
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-green-900 px-8 py-12 text-white">
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-green-100 text-lg">
              Welcome to PG-SETU. Please read these terms carefully before using our platform.
            </p>
            <p className="text-green-200 mt-4 text-sm">
              Last Updated: {lastUpdated}
            </p>
          </div>

          <div className="p-8 md:flex md:gap-12">
            {/* Table of Contents - Desktop */}
            <div className="hidden md:block w-1/4 shrink-0">
              <div className="sticky top-24">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                  Table of Contents
                </h3>
                <nav className="space-y-3">
                  {tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-sm text-gray-600 hover:text-green-700 hover:underline transition-colors"
                    >
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="md:w-3/4 prose prose-green max-w-none text-gray-700">
              <div className="md:hidden mb-8 bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Table of Contents</h3>
                <ul className="space-y-2 text-sm">
                  {tableOfContents.map((item) => (
                    <li key={item.id}>
                      <a href={`#${item.id}`} className="text-green-700 hover:underline">
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <section id="introduction" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">1. Introduction & Acceptance</h2>
                <p>
                  These Terms of Service ("Terms") govern your access to and use of the PG-SETU platform, operated by PGSetu PropTech Technologies Pvt. Ltd. ("Company", "we", "us", or "our"), including our website at staysetu-ruby.vercel.app and related mobile applications (collectively, the "Platform").
                </p>
                <p>
                  By creating an account, accessing, or using the Platform, you agree to be bound by these Terms. If you do not agree, you must not use our services.
                </p>
              </section>

              <section id="platform-description" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">2. Platform Description</h2>
                <p>PG-SETU operates a two-sided marketplace and SaaS platform:</p>
                <ul>
                  <li><strong>For Property Owners/Managers:</strong> An ERP CRM SaaS for managing properties, tenants, rent collection, and operations.</li>
                  <li><strong>For Tenants/Residents:</strong> A free rental marketplace to discover verified PGs/hostels and a tenant portal to pay rent, raise maintenance requests, and complete digital check-ins.</li>
                </ul>
                <p>We provide the technology infrastructure but do not own, manage, or operate the properties listed on the Platform.</p>
              </section>

              <section id="eligibility" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">3. Eligibility</h2>
                <p>To use our Platform, you must:</p>
                <ul>
                  <li>Be at least 18 years of age.</li>
                  <li>Be a resident of India (for property listings and standard tenant features).</li>
                  <li>Possess a valid Aadhaar number for KYC-dependent features (as applicable).</li>
                  <li>Have the legal capacity to enter into binding contracts under the Indian Contract Act, 1872.</li>
                </ul>
              </section>

              <section id="account-registration" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">4. Account Registration & Security</h2>
                <p>
                  You must register using a valid mobile number (via Firebase Phone Auth) and provide accurate information. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.
                </p>
              </section>

              <section id="property-owners" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">5. For Property Owners & PG Managers</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>ERP CRM Access:</strong> Subject to valid subscription plans.</li>
                  <li><strong>Data Accuracy:</strong> You are responsible for the accuracy of your property listings, availability, and pricing.</li>
                  <li><strong>Data Controllers:</strong> You act as the Data Controller for your residents' personal data uploaded to the ERP. You must handle this data legally and ethically.</li>
                  <li><strong>Aadhaar e-KYC Compliance:</strong> You MUST obtain explicit consent from residents before initiating Aadhaar e-KYC or police verification through our platform.</li>
                  <li><strong>Fair Pricing:</strong> No discriminatory pricing practices based on religion, caste, gender, or race are permitted.</li>
                  <li><strong>Safety Standards:</strong> You are solely responsible for maintaining the physical safety, security, and habitability of your properties.</li>
                </ul>
              </section>

              <section id="tenants" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">6. For Tenants & Residents</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Portal Usage:</strong> The tenant portal is for personal, non-commercial use relating to your tenancy.</li>
                  <li><strong>KYC Verification:</strong> Access to certain properties may require completion of Aadhaar e-KYC as mandated by the property owner.</li>
                  <li><strong>Accuracy:</strong> You must provide truthful and accurate personal information.</li>
                  <li><strong>Prohibited Actions:</strong> Creating fake profiles, submitting forged documents, or generating fraudulent rent receipts for tax evasion is strictly prohibited and will lead to immediate termination and potential legal action.</li>
                </ul>
              </section>

              <section id="all-users" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">7. For All Users</h2>
                <p><strong>Prohibited Activities:</strong></p>
                <ul>
                  <li>Fraud, spamming, phishing, or scraping the Platform.</li>
                  <li>Impersonating any person or entity.</li>
                  <li>Harassing, threatening, or abusing other users.</li>
                  <li>Using fake or altered Aadhaar cards or KYC documents.</li>
                  <li>Reverse engineering, decompiling, or attempting to extract the source code of the Platform.</li>
                </ul>
                <p>
                  <strong>Intellectual Property:</strong> All PG-SETU trademarks, logos, and software are the property of the Company. You retain ownership of your user-generated content, but grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute it on the Platform.
                </p>
              </section>

              <section id="payments" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">8. Payments & Subscriptions</h2>
                <ul>
                  <li><strong>ERP Plans:</strong> Billed on a monthly or yearly basis. Subscriptions auto-renew unless canceled before the billing cycle ends.</li>
                  <li><strong>Taxes:</strong> All SaaS subscription fees are subject to 18% GST as per Indian law.</li>
                  <li><strong>Failed Payments:</strong> May result in temporary suspension of ERP access.</li>
                  <li><strong>Rent Payments (UPI):</strong> Processed securely. We do not hold rent funds; they settle directly to the owner's linked bank account.</li>
                </ul>
                <p>For refund queries, please see our <Link href="/refund-policy" className="text-green-600 hover:underline">Refund Policy</Link>.</p>
              </section>

              <section id="aadhaar-kyc" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">9. Aadhaar e-KYC Special Provisions</h2>
                <p>
                  Our Aadhaar e-KYC services are provided via UIDAI-authorized gateways.
                </p>
                <ul>
                  <li><strong>Consent:</strong> KYC is purely consent-based.</li>
                  <li><strong>Data Minimization:</strong> We do not store full Aadhaar numbers. Only masked Aadhaar and verified status are retained.</li>
                  <li><strong>Privacy:</strong> KYC data is strictly used for identity verification and is NEVER shared with third-party advertisers.</li>
                </ul>
              </section>

              <section id="disclaimer" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">10. Disclaimer of Warranties</h2>
                <p>
                  The Platform is provided on an "AS-IS" and "AS-AVAILABLE" basis. We disclaim all warranties, express or implied, including fitness for a particular purpose. We do not guarantee the absolute accuracy of property listings or the behavior of any tenant or owner.
                </p>
              </section>

              <section id="limitation-liability" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">11. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, PGSetu PropTech Technologies Pvt. Ltd. shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Our total liability for any claims arising under these Terms shall be limited to the total subscription fees paid by you to us in the 3 (three) months preceding the claim.
                </p>
              </section>

              <section id="indemnification" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">12. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless PG-SETU, its directors, employees, and agents from any claims, damages, or expenses arising from your violation of these Terms, your use of the Platform, or your violation of any third-party rights.
                </p>
              </section>

              <section id="dispute-resolution" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">13. Dispute Resolution</h2>
                <p>
                  Any dispute shall first be attempted to be resolved through good faith negotiations. If unresolved within 30 days, it shall be referred to mediation. If mediation fails, the dispute shall be subject to binding arbitration under the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall be Mumbai, Maharashtra.
                </p>
              </section>

              <section id="governing-law" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">14. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of India. Subject to the arbitration clause, the courts of Mumbai shall have exclusive jurisdiction.
                </p>
              </section>

              <section id="changes" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">15. Changes to Terms</h2>
                <p>
                  We may update these Terms periodically. We will notify users of significant changes via the Platform or email. Continued use of the Platform constitutes acceptance of the modified Terms.
                </p>
              </section>

              <section id="contact" className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">16. Contact & Grievance</h2>
                <p>
                  For any legal concerns, grievances, or support, please contact our Grievance Officer:
                </p>
                <div className="bg-green-50 p-6 rounded-lg mt-4 border border-green-200">
                  <p className="font-semibold text-green-900 m-0">Vikram Tomar</p>
                  <p className="m-0 text-green-800">PGSetu PropTech Technologies Pvt. Ltd.</p>
                  <p className="m-0 mt-2">
                    <a href="mailto:vikramtomar0505@gmail.com" className="text-green-700 hover:underline">
                      vikramtomar0505@gmail.com
                    </a>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
