'use client'

import { useState, useRef } from 'react'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, X, FileText, Image as ImageIcon } from 'lucide-react'
import { uploadFileToStorage } from '@/lib/firebase/storage'

interface FirebaseFileUploaderProps {
  storagePath: string
  label?: string
  accept?: string
  maxSizeMb?: number
  onUploadSuccess: (downloadUrl: string, fileName: string) => void
  onUploadError?: (error: string) => void
  currentUrl?: string
}

export function FirebaseFileUploader({
  storagePath,
  label = 'Upload Document / Photo',
  accept = 'image/*,application/pdf',
  maxSizeMb = 5,
  onUploadSuccess,
  onUploadError,
  currentUrl,
}: FirebaseFileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentUrl || null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSizeMb * 1024 * 1024) {
      const err = `File size exceeds ${maxSizeMb} MB limit.`
      setErrorMessage(err)
      onUploadError?.(err)
      return
    }

    setErrorMessage(null)
    setUploading(true)
    setProgress(0)
    setFileName(file.name)

    try {
      const result = await uploadFileToStorage(
        storagePath,
        file,
        (p) => setProgress(p)
      )

      setUploadedUrl(result.downloadUrl)
      setUploading(false)
      onUploadSuccess(result.downloadUrl, file.name)
    } catch (err: any) {
      setUploading(false)
      const errText = err?.message || 'Failed to upload to Firebase Storage.'
      setErrorMessage(errText)
      onUploadError?.(errText)
    }
  }

  const handleClear = () => {
    setUploadedUrl(null)
    setFileName(null)
    setProgress(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
        {label}
      </label>

      {!uploadedUrl ? (
        <div
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${
            uploading
              ? 'border-indigo-500/50 bg-indigo-500/5'
              : 'border-neutral-700/60 hover:border-indigo-500/50 bg-neutral-900/40 hover:bg-neutral-800/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />

          {uploading ? (
            <div className="w-full space-y-3 text-center py-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
              <p className="text-xs text-neutral-400">Uploading {fileName}...</p>
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">{progress}% Complete</span>
            </div>
          ) : (
            <div className="text-center py-2">
              <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-xs text-neutral-200 font-medium">
                Click or drag file to upload
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                PNG, JPG, PDF up to {maxSizeMb}MB (Firebase Cloud Storage)
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-medium text-emerald-300 truncate">
                {fileName || 'File uploaded successfully'}
              </p>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400/80 hover:underline"
              >
                View on Firebase Storage
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
