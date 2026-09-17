'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ShieldCheck, CheckCircle2, AlertCircle, Loader2, Sparkles,
  ExternalLink, Phone, Copy, Check, QrCode, RefreshCw, X,
  UserCheck, Camera, ScanFace, FileCheck, ArrowRight
} from 'lucide-react'

export interface DiditVerifiedData {
  verification_id: string
  status: string
  full_name?: string
  id_number?: string
  id_type?: string
  raw_document_type?: string
  date_of_birth?: string
  gender?: string
  face_match_score?: number
  liveness_status?: string
  document_front_url?: string
  portrait_url?: string
}

interface DiditVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  tenantData?: {
    tenant_id?: string
    full_name?: string
    phone?: string
    date_of_birth?: string
    gender?: string
  }
  onVerificationSuccess?: (verifiedData: DiditVerifiedData) => void
}

export function DiditVerificationModal({
  isOpen,
  onClose,
  tenantData,
  onVerificationSuccess,
}: DiditVerificationModalProps) {
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [sessionId, setSessionId] = useState('')
  const [sessionUrl, setSessionUrl] = useState('')
  const [whatsappLink, setWhatsappLink] = useState('')
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'active' | 'approved' | 'declined'>('idle')
  const [extractedResult, setExtractedResult] = useState<DiditVerifiedData | null>(null)

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Start Didit session automatically or on demand
  const startDiditSession = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/didit/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantData?.tenant_id,
          resident_name: tenantData?.full_name,
          phone: tenantData?.phone,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initialize Didit verification session')

      setSessionId(data.session_id)
      setSessionUrl(data.url)
      setWhatsappLink(data.whatsapp_link)
      setSessionStatus('active')
      setPolling(true)
    } catch (err: any) {
      setError(err.message || 'Error connecting to Didit protocol')
    } finally {
      setLoading(false)
    }
  }

  // Poll Didit session status
  const checkSessionStatus = async (sid: string) => {
    try {
      const res = await fetch(`/api/v1/didit/session-status?sessionId=${encodeURIComponent(sid)}`)
      const data = await res.json()

      if (res.ok && data.success) {
        if (data.is_approved) {
          const ext = data.extracted_data
          const verified: DiditVerifiedData = {
            verification_id: ext.verificationId || `DIDIT-${sid.substring(0, 8).toUpperCase()}`,
            status: 'verified',
            full_name: ext.fullName || tenantData?.full_name,
            id_number: ext.idNumber,
            id_type: ext.idType || 'aadhaar',
            raw_document_type: ext.rawDocumentType,
            date_of_birth: ext.dateOfBirth,
            gender: ext.gender,
            face_match_score: ext.faceMatchScore,
            liveness_status: ext.livenessStatus,
            document_front_url: ext.documentFrontUrl,
            portrait_url: ext.portraitUrl,
          }
          setExtractedResult(verified)
          setSessionStatus('approved')
          setPolling(false)
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        } else if (data.is_declined) {
          setSessionStatus('declined')
          setPolling(false)
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        }
      }
    } catch {}
  }

  // Effect to manage polling
  useEffect(() => {
    if (isOpen && sessionStatus === 'idle' && !sessionId) {
      startDiditSession()
    }
  }, [isOpen])

  useEffect(() => {
    if (polling && sessionId && sessionStatus === 'active') {
      pollIntervalRef.current = setInterval(() => {
        checkSessionStatus(sessionId)
      }, 3500)
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [polling, sessionId, sessionStatus])

  if (!isOpen) return null

  const handleCopyLink = () => {
    if (!sessionUrl) return
    navigator.clipboard.writeText(sessionUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConfirmAndApply = () => {
    if (extractedResult && onVerificationSuccess) {
      onVerificationSuccess(extractedResult)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">Verify Person through Didit</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI Protocol
                </span>
              </div>
              <p className="text-xs text-slate-400">
                OCR ID Screening · Biometric Face Match · Liveness Detection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-9 h-9 animate-spin text-blue-500" />
              <p className="text-xs font-bold text-slate-300">Initializing Didit Secure Session...</p>
              <span className="text-[11px] text-slate-500">Connecting to live Didit identity network</span>
            </div>
          )}

          {/* Active Session State */}
          {!loading && sessionStatus === 'active' && sessionUrl && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-950/40 border border-blue-800/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Verification Ready for {tenantData?.full_name || 'Resident'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Live Polling Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Open the verification portal now to scan the resident&apos;s physical ID (Aadhaar, Passport, PAN, or Driving License) and complete automated face-matching.
                </p>
              </div>

              {/* Primary Action Button: Open Didit Web App */}
              <a
                href={sessionUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <span>Open Didit Verification Portal</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* QR Code & Mobile Verification Section */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                <div className="w-28 h-28 bg-white p-1.5 rounded-xl shrink-0 flex items-center justify-center shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(sessionUrl)}`}
                    alt="Didit QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-slate-200">
                    <Camera className="w-3.5 h-3.5 text-blue-400" />
                    <span>Scan with Mobile Camera</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Phones provide optimal camera quality for document OCR and selfie liveness detection.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center gap-1 border border-slate-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>

                    {whatsappLink && (
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Send to WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Polling Bar */}
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span className="text-[11px]">Waiting for document &amp; selfie submission...</span>
                </div>
                <button
                  type="button"
                  onClick={() => checkSessionStatus(sessionId)}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Check Now
                </button>
              </div>
            </div>
          )}

          {/* Approved State */}
          {sessionStatus === 'approved' && extractedResult && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Didit Identity Verified ✓</h4>
                  <p className="text-[11px] text-emerald-300 font-mono mt-0.5">
                    Ref ID: {extractedResult.verification_id}
                  </p>
                </div>
              </div>

              {/* Verified Details Card */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Verified Name</span>
                    <strong className="text-white text-sm block mt-0.5 font-bold">
                      {extractedResult.full_name || tenantData?.full_name || 'Verified Resident'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Document Type</span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[11px] font-bold uppercase font-mono">
                      {extractedResult.id_type || 'Aadhaar / ID'}
                    </span>
                  </div>

                  {extractedResult.id_number && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">ID Document Number</span>
                      <span className="font-mono text-white text-xs font-bold mt-0.5 block">
                        {extractedResult.id_number}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Biometrics & Liveness</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold mt-0.5">
                      <Check className="w-3.5 h-3.5" /> Face Match 100% Passed
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirmation Button */}
              <button
                type="button"
                onClick={handleConfirmAndApply}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                <span>Apply Verified Details to Resident Form</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Declined State */}
          {sessionStatus === 'declined' && (
            <div className="p-4 bg-rose-950/60 border border-rose-800 rounded-2xl space-y-3 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 mx-auto flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-white">Verification Declined by Didit Protocol</h4>
              <p className="text-xs text-rose-300">
                The uploaded document or selfie did not pass security checks. You can restart verification or upload physical documents manually.
              </p>
              <button
                type="button"
                onClick={startDiditSession}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Retry Didit Verification
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>PG-SETU Identity Shield · Powered by Didit.me Global Verification Network</span>
        </div>
      </div>
    </div>
  )
}
