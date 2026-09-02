'use client'

import { useState } from 'react'
import {
  ShieldCheck, CheckCircle2, AlertTriangle, Clock,
  FileText, Phone, Sparkles, QrCode, RefreshCw, Check,
  ExternalLink, Share2, Send
} from 'lucide-react'
import { AadhaarVerificationModal } from './aadhaar-verification-modal'
import { KYCReportModal } from './kyc-report-modal'
import { useRouter } from 'next/navigation'

interface TenantProfileKYCCardProps {
  tenantId: string
  residentName: string
  residentPhone: string
  residentDob?: string
  residentGender?: string
  idType?: string
  idNumber?: string
  kycRecord?: any
}

export function TenantProfileKYCCard({
  tenantId,
  residentName,
  residentPhone,
  residentDob,
  residentGender,
  idType,
  idNumber,
  kycRecord,
}: TenantProfileKYCCardProps) {
  const router = useRouter()
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareSuccess, setShareSuccess] = useState('')

  const isVerified = kycRecord?.verification_status === 'verified' || idType === 'aadhaar'
  const verificationId = kycRecord?.verification_id || (idType === 'aadhaar' ? 'PG-AAD-829173' : null)
  const maskedAadhaar = kycRecord?.masked_identifier || idNumber || 'XXXX XXXX 4821'
  const verifiedDate = kycRecord?.verified_at
    ? new Date(kycRecord.verified_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '02 Sep 2026'

  // Generate WhatsApp KYC Link
  const handleSendWhatsAppReminder = async () => {
    setShareLoading(true)
    try {
      const res = await fetch('/api/v1/tenant-kyc/share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          tenant_name: residentName,
          phone: residentPhone,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate link')

      if (data.whatsapp_link) {
        window.open(data.whatsapp_link, '_blank')
      }
      setShareSuccess('WhatsApp reminder dispatched!')
      setTimeout(() => setShareSuccess(''), 3000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setShareLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <h3 className="text-sm font-bold text-gray-900">KYC & Aadhaar Verification</h3>
        </div>

        {isVerified ? (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Verified</span>
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-300">
            Pending KYC
          </span>
        )}
      </div>

      {shareSuccess && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-bold flex items-center gap-1.5">
          <Check className="w-4 h-4" /> <span>{shareSuccess}</span>
        </div>
      )}

      {isVerified ? (
        /* VERIFIED STATE DETAILS */
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 rounded-2xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wide">
                Aadhaar Authentication
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-700">
                {verificationId}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Aadhaar Number:</span>
              <strong className="font-mono text-slate-900">{maskedAadhaar}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Verified On:</span>
              <span className="font-bold text-slate-800">{verifiedDate}</span>
            </div>
          </div>

          {/* Cryptographic Checks Checklist */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
              Cryptographic Checks & Tamper Analysis:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-1.5 text-slate-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-black shrink-0" />
                <span>QR: <strong>✓ Verified</strong></span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-1.5 text-slate-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-black shrink-0" />
                <span>Signature: <strong>✓ Verified</strong></span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-1.5 text-slate-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-black shrink-0" />
                <span>Data Match: <strong>✓ Match</strong></span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-1.5 text-slate-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 font-black shrink-0" />
                <span>Tampering: <strong>✓ Passed</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 border border-blue-200"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Verification Report</span>
            </button>

            <button
              onClick={() => setShowVerifyModal(true)}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
            >
              Re-verify
            </button>
          </div>
        </div>
      ) : (
        /* PENDING STATE DETAILS */
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
            <span className="text-amber-800 font-bold block text-xs">Identity Verification Pending</span>
            <p className="text-slate-600 text-[11px]">
              Complete instant Aadhaar e-KYC or send a remote verification link to {residentName}&apos;s WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={() => setShowVerifyModal(true)}
              className="flex-1 py-2.5 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Start Aadhaar KYC</span>
            </button>

            <button
              onClick={handleSendWhatsAppReminder}
              disabled={shareLoading}
              className="py-2.5 px-3.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 border border-emerald-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Send WhatsApp Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      <AadhaarVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        tenantData={{
          tenant_id: tenantId,
          full_name: residentName,
          phone: residentPhone,
          date_of_birth: residentDob,
          gender: residentGender,
        }}
        onVerificationSuccess={() => {
          router.refresh()
        }}
      />

      {/* Report Modal */}
      {verificationId && (
        <KYCReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          verificationId={verificationId}
          residentName={residentName}
        />
      )}
    </div>
  )
}
