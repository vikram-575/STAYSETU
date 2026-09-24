'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileBadge, Plus, Download, ExternalLink, FileText, Image as ImageIcon,
  ShieldCheck, CheckCircle2, AlertCircle, Loader2, X, Upload, Check
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface VaultDocument {
  id: string
  doc_name: string
  doc_type: string
  file_url: string
  status: string
  created_at: string
  notes?: string | null
  verified_at?: string | null
}

interface ResidentDocumentsVaultProps {
  residentId: string
  documents: VaultDocument[]
}

export default function ResidentDocumentsVault({
  residentId,
  documents: initialDocuments,
}: ResidentDocumentsVaultProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [documents, setDocuments] = useState<VaultDocument[]>(initialDocuments)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('other')
  const [notes, setNotes] = useState('')
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    if (!docName) {
      // Auto-fill friendly name from file
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      setDocName(baseName.charAt(0).toUpperCase() + baseName.slice(1))
    }

    const reader = new FileReader()
    reader.onload = () => {
      setFileDataUrl(reader.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docName.trim()) {
      setError('Please provide a document name.')
      return
    }
    if (!fileDataUrl) {
      setError('Please select a file to upload.')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const res = await fetch(`/api/residents/${residentId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_name: docName.trim(),
          doc_type: docType,
          file_url: fileDataUrl,
          notes: notes.trim() || undefined,
          status: 'verified',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload document')
      }

      setDocuments((prev) => [data.document, ...prev])
      setShowUploadModal(false)
      setDocName('')
      setDocType('other')
      setNotes('')
      setFileDataUrl(null)
      setFileName(null)
      router.refresh()
    } catch (err: any) {
      console.error('[Document Upload Error]:', err)
      setError(err.message || 'Failed to save document')
    } finally {
      setUploading(false)
    }
  }

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'aadhaar':
        return <FileBadge className="w-5 h-5 text-blue-600 shrink-0" />
      case 'photo':
        return <ImageIcon className="w-5 h-5 text-purple-600 shrink-0" />
      case 'agreement':
        return <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
      default:
        return <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
    }
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-3.5 sm:p-5 shadow-xs space-y-4">
      {/* Header bar with Upload button */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Secure Document Vault
          </h3>
          <p className="text-[11px] text-gray-500">
            Encrypted storage for Aadhaar cards, profile photos, agreements, and IDs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {documents && documents.length > 0 ? (
          documents.map((doc) => {
            const isAadhaarCard = doc.doc_type === 'aadhaar' || doc.file_url.includes('aadhaar-card')
            const viewUrl = isAadhaarCard ? `/api/residents/${residentId}/documents/aadhaar-card` : doc.file_url

            return (
              <div
                key={doc.id}
                className="p-3.5 border border-gray-200 rounded-2xl flex flex-col justify-between text-xs shadow-2xs bg-white hover:border-blue-200 transition-colors gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
                      {getDocIcon(doc.doc_type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate" title={doc.doc_name}>
                        {doc.doc_name}
                      </p>
                      <p className="text-gray-400 text-[10px] uppercase font-semibold mt-0.5">
                        {doc.doc_type.replace('_', ' ')} · {formatDate(doc.created_at)}
                      </p>
                      {doc.notes && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 italic">
                          {doc.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full shrink-0 ${
                      doc.status === 'verified'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>

                {/* Document Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <a
                    href={viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-bold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View / Print
                  </a>
                  <a
                    href={viewUrl}
                    download={doc.doc_name}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-2 py-10 text-center text-gray-400 text-xs bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
            <FileBadge className="w-8 h-8 text-gray-300 mx-auto" />
            <p>No KYC documents uploaded yet.</p>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Upload First Document
            </button>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900">Upload to Secure Document Vault</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false)
                  setError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Document Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rental Agreement, College ID Card, Aadhaar Card"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Document Type *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="agreement">Rental Agreement</option>
                  <option value="photo">Live Photo / Profile Picture</option>
                  <option value="police_verification">Police Verification Form</option>
                  <option value="student_id">College / Student ID</option>
                  <option value="company_id">Company / Employee ID</option>
                  <option value="driving_licence">Driving License</option>
                  <option value="passport">Passport</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">File Attachment *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-700 font-semibold transition"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  {fileName ? (
                    <span className="truncate max-w-[240px] text-blue-700 font-bold">{fileName}</span>
                  ) : (
                    'Select PDF or Image File'
                  )}
                </button>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Notes / Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Verified by owner on check-in"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false)
                    setError(null)
                  }}
                  className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !fileDataUrl}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Upload Document
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
