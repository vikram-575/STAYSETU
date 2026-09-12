'use client'

import { useState, useEffect } from 'react'
import {
  Palette, Globe, ShieldCheck, CheckCircle2, Copy,
  Check, Save, RefreshCw, ExternalLink, Image as ImageIcon,
  Loader2
} from 'lucide-react'

export default function WhiteLabelPage() {
  const [config, setConfig] = useState<any>(null)
  const [dns, setDns] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [copiedTarget, setCopiedTarget] = useState(false)

  // Form State
  const [brandName, setBrandName] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#16A34A')
  const [invoiceTagline, setInvoiceTagline] = useState('')
  const [supportEmail, setSupportEmail] = useState('')
  const [supportPhone, setSupportPhone] = useState('')
  const [smsSenderId, setSmsSenderId] = useState('')

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true)
        const res = await fetch('/api/erp/white-label')
        const data = await res.json()
        if (res.ok && data.config) {
          setConfig(data.config)
          setDns(data.dnsInstructions)
          setBrandName(data.config.brandName)
          setCustomDomain(data.config.customDomain)
          setPrimaryColor(data.config.primaryColor)
          setInvoiceTagline(data.config.invoiceTagline)
          setSupportEmail(data.config.supportEmail)
          setSupportPhone(data.config.supportPhone)
          setSmsSenderId(data.config.smsSenderId)
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch('/api/erp/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          customDomain,
          primaryColor,
          invoiceTagline,
          supportEmail,
          supportPhone,
          smsSenderId,
        }),
      })
      if (res.ok) {
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 3000)
      }
    } catch {
      alert('Error saving brand configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]/20">
              CUSTOM BRANDING
            </span>
            <h1 className="text-xl font-black text-gray-900">White-Label Branding & Custom Domain</h1>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Deliver a completely branded experience with your own logo, colors, custom domain (e.g., portal.mybrand.in), and SMS sender ID.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <form onSubmit={handleSave} className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-gray-900 border-b pb-3">Brand Identity Configuration</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Company / Brand Name *</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Primary Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 p-0.5 border rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Custom Domain / Subdomain</label>
                <input
                  type="text"
                  placeholder="portal.royalstays.in"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">6-Letter SMS Sender ID (DLT)</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="RYLSTY"
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border rounded-xl font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">Invoice Tagline / Brand Subtitle</label>
                <input
                  type="text"
                  placeholder="Premium Co-Living Accommodation & Executive Hostels"
                  value={invoiceTagline}
                  onChange={(e) => setInvoiceTagline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Resident Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Resident Support Phone</label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-gray-100">
              {savedSuccess ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Brand updates saved successfully!
                </span>
              ) : <span />}

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#16A34A] hover:bg-[#14532D] text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save White-Label Changes</span>
              </button>
            </div>
          </form>

          {/* DNS CNAME Guide & Preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b pb-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h4 className="font-black text-gray-900">Custom Domain DNS Settings</h4>
              </div>

              <p className="text-gray-500 text-[11px]">
                To map your own domain, add a CNAME record in your domain registrar (GoDaddy, Cloudflare, Namecheap):
              </p>

              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">Record Type:</span>
                  <strong className="text-gray-800">CNAME</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Host / Name:</span>
                  <strong className="text-gray-800">portal</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Target Value:</span>
                  <div className="flex items-center gap-1">
                    <strong className="text-blue-700">cname.pgsetu.com</strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('cname.pgsetu.com')
                        setCopiedTarget(true)
                        setTimeout(() => setCopiedTarget(false), 2000)
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {copiedTarget ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SSL Certificate: Active & Auto-Renewing</span>
              </div>
            </div>

            {/* Live Invoice Header Preview */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-black uppercase text-gray-400">Live Resident Invoice Preview</h4>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h5 className="font-black text-sm text-gray-900">{brandName}</h5>
                    <p className="text-[10px] text-gray-500">{invoiceTagline}</p>
                  </div>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 flex justify-between">
                  <span>Support: {supportEmail}</span>
                  <span>{supportPhone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
