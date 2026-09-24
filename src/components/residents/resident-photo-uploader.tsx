'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, Check, Loader2, X, User } from 'lucide-react'
import { initials } from '@/lib/utils'

interface ResidentPhotoUploaderProps {
  residentId: string
  fullName: string
  currentPhotoUrl?: string | null
}

export default function ResidentPhotoUploader({
  residentId,
  fullName,
  currentPhotoUrl,
}: ResidentPhotoUploaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl || null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  const handleSavePhoto = async () => {
    if (!preview) return

    try {
      setUploading(true)
      setError(null)

      const res = await fetch(`/api/residents/${residentId}/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_url: preview,
          doc_name: 'Resident Live Photo (Profile)',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload photo')
      }

      setPhotoUrl(preview)
      setShowModal(false)
      setPreview(null)
      router.refresh()
    } catch (err: any) {
      console.error('[Upload Live Photo Error]:', err)
      setError(err.message || 'Failed to save photo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => setShowModal(true)}>
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg sm:text-xl font-black border border-blue-200 shrink-0 overflow-hidden shadow-2xs">
          {photoUrl ? (
            <img src={photoUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            initials(fullName)
          )}
        </div>
        <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
          <Camera className="w-5 h-5" />
        </div>
        <button
          type="button"
          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs border-2 border-white"
          title="Upload Live Photo"
        >
          <Camera className="w-3 h-3" />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-gray-900">Upload Live Resident Photo</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setPreview(null)
                  setError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Take a live photo or upload from device. This photo will be displayed in the resident profile and registered in the Secure Document Vault.
            </p>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center relative">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : photoUrl ? (
                  <img src={photoUrl} alt="Current Photo" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-300" />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition"
              >
                <Upload className="w-4 h-4" />
                {preview ? 'Change Photo' : 'Take Selfie / Choose Photo'}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setPreview(null)
                  setError(null)
                }}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!preview || uploading}
                onClick={handleSavePhoto}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" /> Save Photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
