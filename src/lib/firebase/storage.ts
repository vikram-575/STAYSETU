import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask,
} from 'firebase/storage'
import { storage } from './client'

export interface UploadProgressCallback {
  (progress: number, snapshot: any): void
}

/**
 * Upload a file (File or Blob) to Firebase Storage with progress tracking
 * @param path Storage folder path e.g. "kyc/org_123/resident_456/aadhaar.jpg"
 * @param file File to upload
 * @param onProgress Optional progress callback (0 - 100)
 */
export async function uploadFileToStorage(
  path: string,
  file: File | Blob,
  onProgress?: UploadProgressCallback
): Promise<{ downloadUrl: string; fullPath: string; name: string }> {
  const timestamp = Date.now()
  const cleanPath = `${path.replace(/\/+$/, '')}_${timestamp}`
  const storageRef = ref(storage, cleanPath)
  const uploadTask: UploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        if (onProgress) {
          onProgress(progress, snapshot)
        }
      },
      (error) => {
        console.error('[Firebase Storage Upload Error]', error)
        reject(error)
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve({
          downloadUrl,
          fullPath: uploadTask.snapshot.ref.fullPath,
          name: uploadTask.snapshot.ref.name,
        })
      }
    )
  })
}

/**
 * Upload Resident KYC Document (Aadhaar, PAN, Student ID)
 */
export async function uploadResidentKyc(
  orgId: string,
  residentId: string,
  docType: 'aadhaar_front' | 'aadhaar_back' | 'pan' | 'id_card' | 'photo',
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `kyc/${orgId}/${residentId}/${docType}.${ext}`
  const result = await uploadFileToStorage(path, file, onProgress)
  return result.downloadUrl
}

/**
 * Upload Property / Room Photo
 */
export async function uploadPropertyPhoto(
  orgId: string,
  propertyId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `properties/${orgId}/${propertyId}/photos/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const result = await uploadFileToStorage(path, file, onProgress)
  return result.downloadUrl
}

/**
 * Upload Electricity Sub-Meter Reading Photo
 */
export async function uploadMeterReadingPhoto(
  orgId: string,
  meterId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const dateStr = new Date().toISOString().split('T')[0]
  const path = `meters/${orgId}/${meterId}/readings/${dateStr}_snap.${ext}`
  const result = await uploadFileToStorage(path, file, onProgress)
  return result.downloadUrl
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFileFromStorage(fullPathOrUrl: string): Promise<void> {
  try {
    const fileRef = ref(storage, fullPathOrUrl)
    await deleteObject(fileRef)
  } catch (err: any) {
    console.warn('[Firebase Storage Delete Warning]', err?.message)
  }
}
