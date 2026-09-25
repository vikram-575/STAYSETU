import { MarketplaceNavbar } from "@/components/marketplace/marketplace-navbar";
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer";
import Link from "next/link";
import { Metadata } from "next";
import { Shield, CheckCircle, AlertTriangle, XCircle, Info, Lock, Phone, UserCheck, Eye, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Safety Guidelines & Trust | PG-SETU",
  description: "Learn about PG-SETU verification standards, Aadhaar e-KYC, zero brokerage guarantee, and rental safety guidelines.",
};

export default function SafetyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceNavbar />
      
      <main className="flex-1 pb-16">
        {/* Hero Section */}
        <section className="bg-green-900 text-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Shield className="w-20 h-20 mx-auto mb-6 text-green-400" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Your Safety is Our Priority</h1>
            <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              At PG-SETU, we combine advanced technology with rigorous verification processes to build a secure, trust-first community for property owners and tenants.
            </p>
            
            {/* Trust Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">500+</div>
                <div className="text-green-100 text-sm uppercase tracking-wider">Verified PGs</div>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">10,000+</div>
                <div className="text-green-100 text-sm uppercase tracking-wider">Tenant e-KYCs</div>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-bold text-white mb-2">100%</div>
                <div className="text-green-100 text-sm uppercase tracking-wider">Secure Digital Check-ins</div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 space-y-8">
          
          {/* 1. How We Verify */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <UserCheck className="text-green-600" /> How We Verify Listings
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="bg-green-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                  <CheckCircle className="text-green-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Aadhaar-Verified Owners</h3>
                  <p className="text-gray-600 text-sm mt-1">Property managers must verify their identity via UIDAI-linked Aadhaar before publishing listings.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-green-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                  <CheckCircle className="text-green-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Address Confirmation</h3>
                  <p className="text-gray-600 text-sm mt-1">Physical locations are validated to ensure the property exists exactly where it claims to be.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-green-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                  <CheckCircle className="text-green-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Document Verification</h3>
                  <p className="text-gray-600 text-sm mt-1">We check utility bills, GST certificates (where applicable), and business registrations.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-green-100 p-3 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                  <Shield className="text-green-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">The "Verified" Badge</h3>
                  <p className="text-gray-600 text-sm mt-1">Look for the green verified checkmark. It means the listing has passed our 3-step security audit.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 2. Safety Tips for Tenants */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-green-800">Safety Tips for Tenants</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Never pay advance without visiting:</strong> Always visit the PG in person before transferring money.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Video call verification:</strong> If you can't visit, ask for a live video tour of the premises.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Search className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Check reviews:</strong> Read verified resident reviews on our platform.</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Beware of too-good prices:</strong> If a luxury room is offered at an unbelievably low price, it's likely a scam.</span>
                </li>
              </ul>
            </section>

            {/* 3. Safety Tips for Owners */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-green-800">Safety Tips for Owners</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Always KYC verify residents:</strong> Use the PG-SETU app to perform instant Aadhaar e-KYC before onboarding.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Signed agreements:</strong> Generate and collect digitally signed rental agreements.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Police verification:</strong> Ensure local police verification forms are submitted for all new tenants.</span>
                </li>
                <li className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700"><strong>Digital Check-in:</strong> Mandate emergency contact information during the digital check-in process.</span>
                </li>
              </ul>
            </section>
          </div>

          {/* 4. Aadhaar e-KYC & Data Security */}
          <section className="bg-green-50 rounded-2xl border border-green-100 p-8 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center gap-3">
                <Lock className="text-green-700" /> Aadhaar e-KYC Explained
              </h2>
              <p className="text-green-800 mb-4">
                We partner with UIDAI-authorized gateways to provide secure identity verification.
              </p>
              <ul className="space-y-3 text-green-800 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Verifies identity instantly</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> We store ONLY masked Aadhaar (last 4 digits)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Data is never shared with advertisers</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Secured with industry-standard 256-bit encryption</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
              <h3 className="font-bold text-gray-900 mb-2">Data Security Commitment</h3>
              <p className="text-gray-600 text-sm mb-4">
                Your personal and financial information is protected using modern Supabase row-level security policies, Firebase authentication, and encrypted data transit. We maintain a strict incident response protocol to handle any security anomalies.
              </p>
              <Link href="/terms" className="text-green-600 text-sm font-semibold hover:underline">
                Read our full Privacy & Terms →
              </Link>
            </div>
          </section>

          {/* 5. Zero Brokerage & Fraud Prevention */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Fraud Prevention & Zero Brokerage</h2>
            
            <div className="bg-green-900 text-white p-6 rounded-xl mb-8 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Zero Brokerage Guarantee</h3>
                <p className="text-green-100">PG-SETU is a 100% free marketplace for tenants. If any owner or person claiming to be from PG-SETU asks for brokerage or a "platform fee" to show you a room, report them immediately.</p>
              </div>
              <Shield className="w-16 h-16 text-green-400 shrink-0 opacity-80" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-4">Red Flags Checklist (Common Rental Scams in India)</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
                <h4 className="font-semibold text-red-900 text-sm mb-1">The "Army Officer" Scam</h4>
                <p className="text-red-700 text-xs">Scammers claim to be transferred military personnel and ask for token money via QR code before showing the property.</p>
              </div>
              <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
                <h4 className="font-semibold text-red-900 text-sm mb-1">Urgency Tactics</h4>
                <p className="text-red-700 text-xs">"Pay now or someone else will take it." High pressure to transfer money immediately without a physical visit.</p>
              </div>
              <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
                <h4 className="font-semibold text-red-900 text-sm mb-1">Fake Links</h4>
                <p className="text-red-700 text-xs">Receiving links via SMS/WhatsApp claiming to be "PG-SETU Booking Payment". Always pay directly to the owner after visiting.</p>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2 text-sm">PG-SETU will NEVER ask you for:</h4>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> OTPs or Passwords</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> UPI PINs</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Booking advance to our bank account</li>
                <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> Brokerage fees</li>
              </ul>
            </div>
          </section>

          {/* 7 & 9. Contact and Reporting */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help or Want to Report an Issue?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              If you encounter a suspicious listing, face harassment, or need emergency support regarding a booking, our team is here to help. Use the "Report Listing" button on property pages or contact us directly.
            </p>
            
            <div className="inline-flex flex-col md:flex-row gap-6 items-center justify-center bg-gray-50 p-6 rounded-xl border border-gray-200 w-full max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <Phone className="w-6 h-6 text-green-700" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500 font-medium">Emergency / Grievance</div>
                  <div className="font-bold text-gray-900">Vikram Tomar</div>
                </div>
              </div>
              
              <div className="hidden md:block w-px h-12 bg-gray-300"></div>
              
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="text-sm text-gray-500 font-medium">Support Email</div>
                  <a href="mailto:vikramtomar0505@gmail.com" className="font-bold text-green-700 hover:underline">
                    vikramtomar0505@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
}
