import React from "react";
import { MarketplaceNavbar } from "@/components/marketplace/marketplace-navbar";
import { MarketplaceFooter } from "@/components/marketplace/marketplace-footer";
import { Cookie, Info, ShieldAlert, Settings } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Cookie Policy | PG-SETU",
  description: "Cookie Policy explaining how PG-SETU uses cookies and tracking technologies.",
};

export default function CookiesPolicyPage() {
  const lastUpdated = "September 24, 2026";

  const sections = [
    { id: "what-are-cookies", title: "1. What Are Cookies" },
    { id: "types-we-use", title: "2. Types of Cookies We Use" },
    { id: "specific-cookies", title: "3. Specific Cookies Table" },
    { id: "firebase-auth", title: "4. Firebase Auth Session Token" },
    { id: "supabase-session", title: "5. Supabase Session Cookie" },
    { id: "local-storage", title: "6. Local Storage Usage" },
    { id: "third-party", title: "7. Third-Party Cookies" },
    { id: "manage-cookies", title: "8. How to Manage Cookies" },
    { id: "impact-disabling", title: "9. Impact of Disabling Cookies" },
    { id: "contact", title: "10. Contact Us" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MarketplaceNavbar onOpenListModal={() => {}} />

      {/* Hero Section */}
      <div className="bg-green-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <Cookie className="h-16 w-16 mx-auto mb-6 text-green-400" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Cookie Policy</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            Understanding how PG-SETU uses cookies to improve your experience.
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
                <Info className="w-4 h-4 mr-2 text-green-600" />
                Contents
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
            
            <section id="what-are-cookies" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">1</span>
                What Are Cookies
              </h2>
              <p>
                Cookies are small text files that are placed on your computer or mobile device by websites that you visit. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
              </p>
            </section>

            <section id="types-we-use" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">2</span>
                Types of Cookies We Use
              </h2>
              <ul className="space-y-3">
                <li>
                  <strong>Essential Cookies:</strong> Strictly necessary for the platform to function (e.g., authentication sessions, CSRF protection). The site cannot function properly without these.
                </li>
                <li>
                  <strong>Functional Cookies:</strong> Used to remember your preferences (like language choices or UI themes) to provide a tailored experience.
                </li>
                <li>
                  <strong>Analytics Cookies:</strong> Help us understand how visitors interact with our platform by collecting anonymous page view and interaction data.
                </li>
                <li>
                  <strong>Security Cookies:</strong> Help us authenticate users, prevent fraudulent use of login credentials, and protect user data (e.g., rate limiting).
                </li>
              </ul>
            </section>

            <section id="specific-cookies" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">3</span>
                Specific Cookies Table
              </h2>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-3 border-b-2 border-slate-200">Name</th>
                      <th className="p-3 border-b-2 border-slate-200">Purpose</th>
                      <th className="p-3 border-b-2 border-slate-200">Duration</th>
                      <th className="p-3 border-b-2 border-slate-200">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border-b border-slate-100 font-mono text-sm">sb-[project]-auth-token</td>
                      <td className="p-3 border-b border-slate-100">Supabase authentication session</td>
                      <td className="p-3 border-b border-slate-100">7 Days</td>
                      <td className="p-3 border-b border-slate-100 font-medium text-green-700">Essential</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-100 font-mono text-sm">__session</td>
                      <td className="p-3 border-b border-slate-100">Firebase authentication state</td>
                      <td className="p-3 border-b border-slate-100">Session</td>
                      <td className="p-3 border-b border-slate-100 font-medium text-green-700">Essential</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-b border-slate-100 font-mono text-sm">theme_preference</td>
                      <td className="p-3 border-b border-slate-100">Stores UI theme preference</td>
                      <td className="p-3 border-b border-slate-100">1 Year</td>
                      <td className="p-3 border-b border-slate-100 font-medium text-blue-700">Functional</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-3 border-b border-slate-100 font-mono text-sm">_ga, _gid</td>
                      <td className="p-3 border-b border-slate-100">Google Analytics (Anonymized)</td>
                      <td className="p-3 border-b border-slate-100">2 Years / 24h</td>
                      <td className="p-3 border-b border-slate-100 font-medium text-purple-700">Analytics</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="firebase-auth" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">4</span>
                Firebase Auth Session Token
              </h2>
              <p>
                We use Firebase Phone Auth for sending OTPs. Firebase stores temporary tokens in your browser to verify the OTP and establish your identity. These tokens are essential for logging in and expire automatically when your session ends or you log out.
              </p>
            </section>

            <section id="supabase-session" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">5</span>
                Supabase Session Cookie
              </h2>
              <p>
                Once authenticated, a session cookie is generated by Supabase (our database provider) to keep you securely logged in across pages. This cookie has a strict 7-day expiry, is marked as <code>httpOnly</code> (meaning it cannot be accessed via JavaScript to prevent XSS attacks), and is transmitted securely.
              </p>
            </section>

            <section id="local-storage" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">6</span>
                Local Storage Usage
              </h2>
              <p>
                In addition to cookies, we use your browser's Local Storage to store non-sensitive data, such as:
              </p>
              <ul>
                <li>Locally saved properties (your shortlist).</li>
                <li>Draft states for forms (so you don't lose progress if you accidentally refresh).</li>
              </ul>
              <p>This data stays on your device and is not sent to our servers until you explicitly submit a form.</p>
            </section>

            <section id="third-party" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">7</span>
                Third-Party Cookies
              </h2>
              <p>
                We respect your privacy. <strong>PG-SETU does not use any advertising cookies</strong> to track you across other websites. We only use minimal third-party cookies required for essential analytics (like Google Analytics configured to anonymize IP addresses).
              </p>
            </section>

            <section id="manage-cookies" className="scroll-mt-24 mb-10 bg-slate-50 p-6 rounded-lg border border-slate-200">
              <h2 className="text-2xl font-bold pb-2 flex items-center mb-4">
                <Settings className="w-6 h-6 mr-2 text-green-600" />
                8. How to Manage Cookies
              </h2>
              <p>
                Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer">www.aboutcookies.org</a>.
              </p>
              <p className="font-semibold mt-4">Find how to manage cookies on popular browsers:</p>
              <ul className="mt-2">
                <li><a href="https://support.google.com/accounts/answer/61416?co=GENIE.Platform%3DDesktop&hl=en" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
                <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
                <li><a href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
              </ul>
            </section>

            <section id="impact-disabling" className="scroll-mt-24 mb-10">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center text-amber-800">
                <ShieldAlert className="w-5 h-5 mr-2 text-amber-600" />
                9. Impact of Disabling Cookies
              </h2>
              <p>
                If you choose to block or disable cookies, please note that our platform may not function correctly. Specifically, <strong>you will not be able to log in</strong> to the ERP Dashboard or the Tenant Portal, as essential authentication cookies are required to verify your identity securely.
              </p>
            </section>

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-2xl font-bold border-b border-slate-100 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 text-sm py-1 px-2.5 rounded mr-3">10</span>
                Contact Us
              </h2>
              <p>
                If you have any questions about our use of cookies, please refer to our <Link href="/privacy-policy" className="font-semibold underline">Privacy Policy</Link> or contact our Grievance Officer at <a href="mailto:vikramtomar0505@gmail.com" className="text-green-700 font-medium">vikramtomar0505@gmail.com</a>.
              </p>
            </section>

          </main>
        </div>
      </div>

      <MarketplaceFooter />
    </div>
  );
}
