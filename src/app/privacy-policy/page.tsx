import React from "react";
import { MarketplaceNavbar } from "@/components/marketplace/marketplace-navbar";
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer";
import { Shield, Lock, FileText, Server, Users, UserCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | PG-SETU",
  description: "Privacy Policy for PG-SETU platform, explaining how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 24, 2026";

  const sections = [
    { id: "introduction", title: "1. Introduction & Scope" },
    { id: "information-we-collect", title: "2. Information We Collect" },
    { id: "legal-basis", title: "3. Legal Basis for Processing" },
    { id: "how-we-use", title: "4. How We Use Your Information" },
    { id: "how-we-share", title: "5. How We Share Your Information" },
    { id: "aadhaar-kyc", title: "6. Aadhaar & KYC Data" },
    { id: "international-transfers", title: "7. International Data Transfers" },
    { id: "data-retention", title: "8. Data Retention" },
    { id: "your-rights", title: "9. Your Rights" },
    { id: "cookie-policy", title: "10. Cookie Policy" },
    { id: "childrens-privacy", title: "11. Children's Privacy" },
    { id: "security-measures", title: "12. Security Measures" },
    { id: "grievance-officer", title: "13. Grievance Officer" },
    { id: "changes", title: "14. Changes to Policy" },
    { id: "contact-us", title: "15. Contact Us" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceNavbar onOpenListModal={() => {}} />

      {/* Hero Section */}
      <div className="bg-green-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <Shield className="h-16 w-16 mx-auto mb-6 text-green-400" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            At PG-SETU, we are committed to protecting your personal data and respecting your privacy.
          </p>
          <p className="text-sm text-green-300 mt-6">Last Updated: {lastUpdated}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-12 flex-grow">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar - Table of Contents */}
          <aside className="md:w-1/4 hidden md:block">
            <div className="sticky top-24 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-green-600" />
                Table of Contents
              </h3>
              <nav className="space-y-2 text-sm max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-slate-600 hover:text-green-700 hover:bg-green-50 px-2 py-1.5 rounded transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="md:w-3/4 bg-white p-6 md:p-10 rounded-xl border border-slate-200 shadow-sm prose prose-slate max-w-none prose-headings:text-green-900 prose-a:text-green-600">
            
            <section id="introduction" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">1</span>
                Introduction & Scope
              </h2>
              <p>
                Welcome to PG-SETU ("PGSetu", "we", "our", "us"), operated by PGSetu PropTech Technologies Pvt. Ltd. (website: staysetu-ruby.vercel.app). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform.
              </p>
              <p>
                This policy applies to all users of our platform, including:
              </p>
              <ul>
                <li><strong>Property Owners / PG Managers:</strong> Using our ERP CRM dashboard.</li>
                <li><strong>Tenants / Residents:</strong> Using the tenant portal and marketplace.</li>
                <li><strong>Visitors:</strong> Browsing our property marketplace.</li>
              </ul>
            </section>

            <section id="information-we-collect" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">2</span>
                Information We Collect
              </h2>
              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-green-600" />
                    (a) Account & Identity Data
                  </h3>
                  <p className="text-slate-600">Name, phone number, email address, date of birth, gender, profile photo, and masked Aadhaar number (last 4 digits visible).</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                    <Server className="w-5 h-5 mr-2 text-green-600" />
                    (b) Property & Listing Data
                  </h3>
                  <p className="text-slate-600">For owners: property details, ownership proofs, GST details (if applicable), and bank account details for settlements.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-green-600" />
                    (c) Resident/Tenant Data
                  </h3>
                  <p className="text-slate-600">Check-in/check-out records, emergency contacts, KYC documents, rent payment history, and grievance records.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    (d) Payment Information
                  </h3>
                  <p className="text-slate-600">Transaction IDs, payment modes (UPI/bank transfer). <strong>Note:</strong> We do NOT store full credit/debit card numbers.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    (e) Device & Usage Data
                  </h3>
                  <p className="text-slate-600">IP addresses, browser types, operating systems, and pages visited on our platform.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    (f) Communications
                  </h3>
                  <p className="text-slate-600">WhatsApp messages sent via our official bot, email correspondence, and support tickets.</p>
                </div>
              </div>
            </section>

            <section id="legal-basis" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">3</span>
                Legal Basis for Processing
              </h2>
              <p>We process your personal data under the following legal frameworks:</p>
              <ul>
                <li>Information Technology Act, 2000 and the SPDI Rules, 2011 (India).</li>
                <li><strong>Consent:</strong> Where you have provided explicit consent.</li>
                <li><strong>Contractual Necessity:</strong> To fulfill our agreements with owners and tenants.</li>
                <li><strong>Legitimate Interests:</strong> To improve our services, prevent fraud, and ensure security.</li>
              </ul>
            </section>

            <section id="how-we-use" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">4</span>
                How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Management:</strong> Creating and maintaining user accounts.</li>
                <li><strong>KYC Verification:</strong> Validating identities to ensure platform safety.</li>
                <li><strong>Billing & Payments:</strong> Processing rent, deposits, and service fees.</li>
                <li><strong>Platform Analytics:</strong> Understanding user behavior to improve our UI/UX.</li>
                <li><strong>Communications:</strong> Sending OTPs, payment reminders, and essential updates.</li>
                <li><strong>Safety & Security:</strong> Monitoring for unauthorized access or fraudulent activities.</li>
              </ul>
            </section>

            <section id="how-we-share" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">5</span>
                How We Share Your Information
              </h2>
              <p>We do not sell your data. We share data only with trusted partners essential to our operations:</p>
              <ul>
                <li><strong>Supabase:</strong> For secure database hosting (PostgreSQL) and cloud infrastructure.</li>
                <li><strong>Firebase:</strong> For Phone Authentication and OTP delivery.</li>
                <li><strong>WhatsApp Business API:</strong> For delivering important transactional messages.</li>
                <li><strong>UIDAI / Authorized KYC Providers:</strong> Strictly for Aadhaar verification purposes.</li>
                <li><strong>Analytics Providers:</strong> For anonymized usage tracking.</li>
              </ul>
            </section>

            <section id="aadhaar-kyc" className="scroll-mt-24 mb-10 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-2xl font-bold text-green-900 pb-2 flex items-center">
                <ShieldCheck className="w-6 h-6 mr-2 text-green-600" />
                6. Aadhaar & KYC Data (Special Policy)
              </h2>
              <p className="text-green-800">
                We strictly adhere to UIDAI regulations regarding Aadhaar data collection and storage:
              </p>
              <ul className="text-green-800 space-y-1 mt-2">
                <li>All KYC data is encrypted at rest using 256-bit encryption.</li>
                <li>We <strong>never</strong> store full 12-digit Aadhaar numbers long-term. Only masked formats (e.g., XXXXXXXX1234) are retained.</li>
                <li>Live photos and biometric data (if collected during e-KYC) are not retained beyond the immediate verification process.</li>
              </ul>
            </section>

            <section id="international-transfers" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">7</span>
                International Data Transfers
              </h2>
              <p>
                While PG-SETU operates in India, some of our cloud infrastructure (such as Supabase or Firebase) may involve servers located outside India (e.g., the United States). In such cases, we ensure that adequate Standard Contractual Clauses and security measures are in place to protect your data.
              </p>
            </section>

            <section id="data-retention" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">8</span>
                Data Retention
              </h2>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-3 border-b-2 border-slate-200">Data Type</th>
                      <th className="p-3 border-b-2 border-slate-200">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b border-slate-100 font-medium">Account Data</td>
                      <td className="p-3 border-b border-slate-100">Until account deletion request is processed.</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-100 font-medium">KYC Records</td>
                      <td className="p-3 border-b border-slate-100">5 years (as per regulatory/law enforcement requirements).</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b border-slate-100 font-medium">Payment Records</td>
                      <td className="p-3 border-b border-slate-100">7 years (as per tax and financial laws).</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-100 font-medium">Usage Logs</td>
                      <td className="p-3 border-b border-slate-100">90 days.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="your-rights" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">9</span>
                Your Rights
              </h2>
              <p>Depending on your jurisdiction, you have the right to:</p>
              <ul>
                <li><strong>Access:</strong> Request copies of your personal data.</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data.</li>
                <li><strong>Deletion:</strong> Request erasure of your data (subject to legal retention requirements).</li>
                <li><strong>Restrict Processing:</strong> Request limitations on how we use your data.</li>
                <li><strong>Data Portability:</strong> Request transfer of your data to another organization.</li>
                <li><strong>Withdraw Consent:</strong> Withdraw previously given consent for data processing.</li>
              </ul>
            </section>

            <section id="cookie-policy" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">10</span>
                Cookie Policy
              </h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our platform and hold certain information. For detailed information on the types of cookies we use and how you can control them, please visit our <Link href="/cookies-policy" className="font-semibold underline">Cookie Policy</Link>.
              </p>
            </section>

            <section id="childrens-privacy" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">11</span>
                Children's Privacy
              </h2>
              <p>
                Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal identifiable information from anyone under 18. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us.
              </p>
            </section>

            <section id="security-measures" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">12</span>
                Security Measures
              </h2>
              <p>The security of your data is important to us. We implement robust security measures including:</p>
              <ul>
                <li><strong>256-bit Encryption:</strong> For data in transit and at rest.</li>
                <li><strong>Role-Based Access Control (RBAC):</strong> To ensure employees/staff only access data necessary for their roles.</li>
                <li><strong>Audit Logs:</strong> Tracking access to sensitive information.</li>
                <li><strong>No Full Aadhaar Storage:</strong> Minimizing risk by not storing highly sensitive unmasked IDs.</li>
              </ul>
            </section>

            <section id="grievance-officer" className="scroll-mt-24 mb-10 p-6 bg-slate-50 border border-slate-200 rounded-lg">
              <h2 className="text-2xl font-bold border-b border-slate-200 pb-2 flex items-center mb-4">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">13</span>
                Grievance Officer
              </h2>
              <p>
                In accordance with the Information Technology Act, 2000 and rules made there under, the name and contact details of the Grievance Officer are provided below:
              </p>
              <div className="mt-4 p-4 bg-white rounded border border-slate-200 shadow-sm">
                <p className="font-bold text-lg">Vikram Tomar</p>
                <p className="text-slate-600">Grievance Officer, PGSetu PropTech Technologies Pvt. Ltd.</p>
                <p className="text-green-700 font-medium mt-2">
                  <a href="mailto:vikramtomar0505@gmail.com">vikramtomar0505@gmail.com</a>
                </p>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                We will acknowledge your complaint within 24 hours and aim to resolve it within 30 days.
              </p>
            </section>

            <section id="changes" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">14</span>
                Changes to Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section id="contact-us" className="scroll-mt-24">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">15</span>
                Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:vikramtomar0505@gmail.com" className="text-green-700 font-medium">vikramtomar0505@gmail.com</a>.
              </p>
            </section>

          </main>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
}
