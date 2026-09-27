'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Camera, UploadCloud, CheckCircle2, AlertCircle, Loader2,
  X, Image as ImageIcon, RefreshCw, Eye, Video, Sparkles
} from 'lucide-react'
import { uploadFileToStorage } from '@/lib/firebase/storage'

interface FirebaseFileUploaderProps {
  storagePath: string
  label?: string
  accept?: string
  maxSizeMb?: number
  onUploadSuccess: (downloadUrl: string, fileName: string) => void
  onUploadError?: (error: string) => void
  currentUrl?: string
  enableCamera?: boolean
  cameraFacing?: 'environment' | 'user'
}

export function FirebaseFileUploader({
  storagePath,
  label = 'Upload Document / Photo',
  accept = 'image/*,application/pdf',
  maxSizeMb = 10,
  onUploadSuccess,
  onUploadError,
  currentUrl,
  enableCamera = true,
  cameraFacing = 'environment',
}: FirebaseFileUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentUrl || null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Live in-browser camera modal state
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isCameraStarting, setIsCameraStarting] = useState(false)

  // Input references
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Stop video stream when modal closes
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraStream])

  // Handle file selected from file picker or camera capture
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await processAndUploadFile(file)
  }

  // Unified process and upload
  const processAndUploadFile = async (file: File | Blob, customName?: string) => {
    if (file.size > maxSizeMb * 1024 * 1024) {
      const err = `File size exceeds ${maxSizeMb} MB limit.`
      setErrorMessage(err)
      onUploadError?.(err)
      return
    }

    setErrorMessage(null)
    setUploading(true)
    setProgress(0)

    const name = customName || (file instanceof File ? file.name : `meter_photo_${Date.now()}.jpg`)
    setFileName(name)

    try {
      const result = await uploadFileToStorage(
        storagePath,
        file,
        (p) => setProgress(p)
      )

      setUploadedUrl(result.downloadUrl)
      setUploading(false)
      onUploadSuccess(result.downloadUrl, name)
    } catch (err: any) {
      setUploading(false)
      const errText = err?.message || 'Failed to upload photo to secure storage.'
      setErrorMessage(errText)
      onUploadError?.(errText)
    }
  }

  // Start live camera stream
  const startLiveCamera = async () => {
    // If not supported or on mobile where native camera is faster, trigger native camera
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isMobile) {
      cameraInputRef.current?.click()
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraInputRef.current?.click()
      return
    }

    setIsLiveCameraOpen(true)
    setIsCameraStarting(true)
    setErrorMessage(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: cameraFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsCameraStarting(false)
    } catch (err: any) {
      console.warn('getUserMedia error, falling back to native camera input:', err)
      setIsLiveCameraOpen(false)
      setIsCameraStarting(false)
      // Fallback directly to native camera input
      cameraInputRef.current?.click()
    }
  }

  // Stop live camera
  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
      setCameraStream(null)
    }
    setIsLiveCameraOpen(false)
    setIsCameraStarting(false)
  }

  // Capture frame from live video
  const captureFrameFromVideo = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          stopLiveCamera()
          await processAndUploadFile(blob, `meter_snap_${Date.now()}.jpg`)
        }
      },
      'image/jpeg',
      0.9
    )
  }

  const handleClear = () => {
    setUploadedUrl(null)
    setFileName(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[11px] text-gray-400 font-medium">Camera or Gallery</span>
      </div>

      {/* Hidden file inputs */}
      {/* 1. Native rear camera input (capture="environment") */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture={cameraFacing}
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />

      {/* 2. Standard file / gallery picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={uploading}
        className="hidden"
      />

      {/* Hidden canvas for video frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {!uploadedUrl ? (
        <div
          className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 transition-all text-center ${
            uploading
              ? 'border-yellow-500 bg-yellow-50/30'
              : 'border-gray-300 hover:border-yellow-400 bg-gray-50/60 hover:bg-yellow-50/20'
          }`}
        >
          {uploading ? (
            <div className="w-full space-y-3 py-3">
              <Loader2 className="w-7 h-7 animate-spin text-yellow-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-gray-900">Uploading {fileName}...</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Uploading securely to document vault</p>
              </div>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-yellow-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] text-gray-600 font-mono font-bold">{progress}% Complete</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 text-yellow-800 flex items-center justify-center mx-auto shadow-2xs">
                <Camera className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                  Capture Sub-Meter Reading Photo
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 max-w-sm mx-auto">
                  Take a photo of the meter dial directly with your camera, or choose an existing photo from your gallery.
                </p>
              </div>

              {/* Action Buttons: Camera vs Files */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                {enableCamera && (
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger direct native camera capture
                      cameraInputRef.current?.click()
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-gray-950 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo with Camera</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-gray-500" />
                  <span>Choose from Gallery / Files</span>
                </button>
              </div>

              <p className="text-[10px] text-gray-400">
                Supports JPG, PNG · Max {maxSizeMb}MB · Stored with tamper-proof timestamp
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Uploaded Success & Preview Card */
        <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-12 h-12 rounded-xl border border-emerald-200 bg-white overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                <img
                  src={uploadedUrl}
                  alt="Meter Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if not an image URL
                    (e.target as HTMLElement).style.display = 'none'
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-emerald-900 truncate">
                    Meter Photo Attached
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {fileName || 'meter_reading_snapshot.jpg'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition"
                title="View full-size photo"
              >
                <Eye className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-emerald-800 font-medium">
              ✓ Attached to differential reading
            </span>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-700 hover:text-yellow-800"
            >
              <Camera className="w-3.5 h-3.5" /> Retake Photo
            </button>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* In-Browser Live Camera Viewfinder Modal (Desktop / Fallback) */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-yellow-600" />
                <h4 className="text-sm font-bold text-gray-900">Live Camera Viewfinder</h4>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-4/3 bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              {isCameraStarting && (
                <div className="text-center text-white space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow-400" />
                  <p className="text-xs">Starting camera...</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={stopLiveCamera}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureFrameFromVideo}
                className="flex-2 inline-flex items-center justify-center gap-2 py-2.5 bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-gray-950 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Meter Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
