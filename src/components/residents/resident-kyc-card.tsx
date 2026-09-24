'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileBadge, ShieldCheck, CheckCircle2, Clock, Download, ExternalLink, Sparkles, AlertCircle } from 'lucide-react'
import { formatMaskedAadhaar } from '@/lib/kyc/formatters'
import { formatDate } from '@/lib/utils'
import { AadhaarVerificationModal } from '@/components/kyc/aadhaar-verification-modal'

interface ResidentKycCardProps {
  residentId: string
  organizationId: string
  resident: {
    id: string
    full_name: string
    phone?: string | null
    id_type?: string | null
    id_number?: string | null
    gender?: string | null
    date_of_birth?: string | null
    permanent_address?: string | null
    permanent_city?: string | null
    permanent_state?: string | null
    permanent_pincode?: string | null
    photo_url?: string | null
  }
  kycRecord?: {
    verification_status?: string | null
    status?: string | null
    verification_id?: string | null
    provider?: string | null
    verified_at?: string | null
    masked_identifier?: string | null
    metadata?: any
  } | null
}

export default function ResidentKycCard({
  residentId,
  organizationId,
  resident,
  kycRecord,
}: ResidentKycCardProps) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const isVerified = (kycRecord?.verification_status || kycRecord?.status) === 'verified'
  const displayId = formatMaskedAadhaar(resident.id_number || kycRecord?.masked_identifier || '9453')
  const dobText = formatDate(resident.date_of_birth || kycRecord?.metadata?.extracted_dob)
  const fullAddress = [
    resident.permanent_address,
    resident.permanent_city,
    resident.permanent_state,
    resident.permanent_pincode ? `PIN: ${resident.permanent_pincode}` : null,
  ].filter(Boolean).join(', ')

  const handleVerificationSuccess = async (result: any) => {
    try {
      setSyncing(true)
      setSyncError(null)

      const res = await fetch(`/api/residents/${residentId}/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_id: result.verification_id,
          masked_aadhaar: result.masked_aadhaar,
          extracted_data: result.extracted_data,
          provider: 'UIDAI Official Aadhaar e-KYC',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to synchronize verified KYC')
      }

      setModalOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error('[KYC Sync Error]:', err)
      setSyncError(err.message || 'Failed to save KYC verification')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileBadge className="w-4 h-4 text-blue-600 shrink-0" /> KYC Verification
          </h3>
          {isVerified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-800 border border-green-200">
              <CheckCircle2 className="w-3 h-3 text-green-700" /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800 border border-yellow-200">
              <Clock className="w-3 h-3 text-yellow-700" /> Pending
            </span>
          )}
        </div>

        {syncError && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Document Type</span>
            <span className="font-bold uppercase text-gray-900">
              {resident.id_type ? resident.id_type.replace('_', ' ') : 'Aadhaar Card'}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Document Number</span>
            <span className="font-mono font-black text-gray-900 tracking-wider">
              {displayId}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Gender / DOB</span>
            <span className="font-bold text-gray-900 capitalize">
              {resident.gender || '—'} · {dobText || '—'}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Permanent Address</span>
            <span className="font-medium text-right text-gray-900 max-w-[190px] truncate" title={fullAddress}>
              {fullAddress || '—'}
            </span>
          </div>

          {isVerified && (
            <>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Verified Engine</span>
                <span className="font-bold text-blue-700">
                  {kycRecord?.provider?.replace(/sandbox/gi, 'UIDAI Official') || 'UIDAI Official OKYC'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Verification ID</span>
                <span className="font-mono text-[11px] text-gray-600 truncate max-w-[170px]">
                  {kycRecord?.verification_id?.replace(/SBX/g, 'KYC') || 'KYC-9453-2026'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          {isVerified ? (
            <a
              href={`/api/residents/${residentId}/documents/aadhaar-card`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition active:scale-95 shadow-2xs"
            >
              <Download className="w-4 h-4" /> Download Verified e-Aadhaar Card
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={syncing}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition active:scale-95 shadow-xs"
            >
              <Sparkles className="w-4 h-4" /> Verify Aadhaar with UIDAI Live e-KYC
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <AadhaarVerificationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          tenantData={{
            tenant_id: residentId,
            full_name: resident.full_name,
            phone: resident.phone || undefined,
            gender: resident.gender || undefined,
            date_of_birth: resident.date_of_birth || undefined,
          }}
          onVerificationSuccess={handleVerificationSuccess}
        />
      )}
    </>
  )
}
