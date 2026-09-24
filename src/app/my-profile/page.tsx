'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, User, Phone, Mail, Home, Users, Calendar,
  Star, Search, Loader2, ArrowLeft, ArrowRight, RefreshCw, Edit, LogOut,
  CheckCircle2, Clock, Tag, Bed, ShieldCheck, Copy, Check,
  KeyRound, PlusCircle, ExternalLink, ShieldAlert, AlertCircle, X,
  Download, FileText, Wallet, Receipt, CreditCard, ChevronRight, Award, Shield,
  CheckCircle, MapPin, QrCode, Share2, Sparkles, Zap, Smartphone,
  HeartHandshake, ChevronDown, Filter, AlertTriangle, BedDouble, TrendingUp, Plus,
  Camera, UploadCloud, Trash2, Image as ImageIcon,
  Lock, MessageSquare
} from 'lucide-react'
import { ListPropertyModal } from '@/components/marketplace/list-property-modal'

type ProfileTab = 'properties' | 'overview' | 'passbook' | 'stays' | 'kyc'

function MyProfileContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<any>(null)
  const [stays, setStays] = useState<any[]>([])
  const [passbookSummary, setPassbookSummary] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [sharedToast, setSharedToast] = useState(false)
  const [receiptDownloaded, setReceiptDownloaded] = useState<string | null>(null)
  const [txnFilter, setTxnFilter] = useState<'all' | 'rent' | 'deposit' | 'electricity'>('all')

  // Host & Properties State
  const [hostedProperties, setHostedProperties] = useState<any[]>([])
  const [propertyStats, setPropertyStats] = useState<any>(null)
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false)
  const [isListPropertyWizardOpen, setIsListPropertyWizardOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<any>(null)

  // Property Form State
  const [propName, setPropName] = useState('')
  const [propPhone, setPropPhone] = useState('')
  const [propEmail, setPropEmail] = useState('')
  const [propAddress, setPropAddress] = useState('')
  const [propCity, setPropCity] = useState('')
  const [propState, setPropState] = useState('')
  const [propPincode, setPropPincode] = useState('')
  const [propDescription, setPropDescription] = useState('')
  const [propRent, setPropRent] = useState('7500')
  const [propNoticePeriod, setPropNoticePeriod] = useState('30')
  const [propLockIn, setPropLockIn] = useState('3')
  const [propGateClosing, setPropGateClosing] = useState('11:00 PM')
  const [propUpiId, setPropUpiId] = useState('')
  const [propAmenities, setPropAmenities] = useState<string[]>([
    'High-Speed WiFi', 'Power Backup', 'RO Water', '3 Daily Meals', 'Air Conditioning', 'CCTV Security', 'Housekeeping', 'Washing Machine'
  ])
  const [propRules, setPropRules] = useState<string[]>([
    'Gate closes at 11:00 PM', 'Visitors in lounge only', 'No smoking inside rooms'
  ])
  const [savingProperty, setSavingProperty] = useState(false)
  const [propSaveSuccess, setPropSaveSuccess] = useState('')
  const [propSaveError, setPropSaveError] = useState('')

  // Property Photos & Local Upload State (Min 5 recommended)
  const [propPhotos, setPropPhotos] = useState<string[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)

  // Property Deletion State
  const [deletingProperty, setDeletingProperty] = useState<any>(null)
  const [isDeletingProperty, setIsDeletingProperty] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteSuccess, setDeleteSuccess] = useState('')

  const SAMPLE_PG_PHOTOS = [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  ]

  const ALL_AMENITIES = [
    'High-Speed WiFi',
    'Air Conditioning',
    'Power Backup',
    'RO Water',
    '3 Daily Meals',
    'Daily Housekeeping',
    'CCTV Security',
    'Washing Machine',
    'Gym / Fitness',
    'Geyser / Hot Water',
    'Attached Washroom',
    'Refrigerator',
  ]

  const ALL_RULES = [
    'Gate closes at 11:00 PM',
    'Visitors in lounge only',
    'No smoking inside rooms',
    'Quiet hours after 10 PM',
    'Advance rent by 5th of month',
    'Valid Govt ID required',
  ]

  const toggleAmenity = (item: string) => {
    setPropAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    )
  }

  const toggleRule = (item: string) => {
    setPropRules((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
    )
  }

  // Compress and optimize local photo via client-side HTML5 canvas
  const optimizeImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new (window as any).Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          const MAX_DIM = 1280
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width)
              width = MAX_DIM
            } else {
              width = Math.round((width * MAX_DIM) / height)
              height = MAX_DIM
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(event.target?.result as string)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        }
        img.onerror = () => resolve(event.target?.result as string)
        img.src = event.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Multi-photo upload from local files
  const handleLocalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingPhotos(true)
    setPropSaveError('')
    try {
      const fileList = Array.from(files)
      const compressedPhotos = await Promise.all(
        fileList.map((f) => optimizeImageFile(f))
      )
      setPropPhotos((prev) => [...prev, ...compressedPhotos])
    } catch (err: any) {
      console.error('Error processing photos:', err)
      setPropSaveError('Failed to process some images. Please try standard JPG or PNG files.')
    } finally {
      setIsUploadingPhotos(false)
      e.target.value = ''
    }
  }

  const handleRemovePhoto = (indexToRemove: number) => {
    setPropPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleMakeCoverPhoto = (indexToCover: number) => {
    setPropPhotos((prev) => {
      const coverItem = prev[indexToCover]
      const rest = prev.filter((_, idx) => idx !== indexToCover)
      return [coverItem, ...rest]
    })
  }

  const handleAddSamplePhotos = () => {
    setPropPhotos((prev) => {
      const combined = [...prev]
      SAMPLE_PG_PHOTOS.forEach((sample) => {
        if (!combined.includes(sample)) {
          combined.push(sample)
        }
      })
      return combined.slice(0, 10)
    })
  }

  // Confirm delete property handler
  const handleConfirmDeleteProperty = async () => {
    if (!deletingProperty?.id) return
    setIsDeletingProperty(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/properties/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: deletingProperty.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete property')

      setHostedProperties((prev) => prev.filter((p) => p.id !== deletingProperty.id))
      setDeleteSuccess(data.message || `Property "${deletingProperty.name}" deleted successfully.`)
      setDeletingProperty(null)
      setTimeout(() => setDeleteSuccess(''), 4000)
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete property')
    } finally {
      setIsDeletingProperty(false)
    }
  }

  // Modals state
  const [isEditing, setIsEditing] = useState(false)
  const [isAadhaarModalOpen, setIsAadhaarModalOpen] = useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isUpiPayModalOpen, setIsUpiPayModalOpen] = useState(false)
  const [isGatePassModalOpen, setIsGatePassModalOpen] = useState(false)

  // Edit Profile Form State
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editDob, setEditDob] = useState('')
  const [editGender, setEditGender] = useState('male')
  const [editAge, setEditAge] = useState('25')
  const [editProfession, setEditProfession] = useState('')
  const [editCollegeCompany, setEditCollegeCompany] = useState('')
  const [editEmergencyName, setEditEmergencyName] = useState('')
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('')
  const [editEmergencyRelation, setEditEmergencyRelation] = useState('Parent')
  const [editPermanentAddress, setEditPermanentAddress] = useState('')
  const [editPermanentCity, setEditPermanentCity] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')

  // Gated Owner Listing State
  const [isListingLockedModalOpen, setIsListingLockedModalOpen] = useState(false)
  const [isOwnerUnlockedState, setIsOwnerUnlockedState] = useState(true)

  // Aadhaar Verification State
  const [aadhaarInput, setAadhaarInput] = useState('')
  const [aadhaarOtp, setAadhaarOtp] = useState('')
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false)
  const [verifyingAadhaar, setVerifyingAadhaar] = useState(false)
  const [aadhaarSuccess, setAadhaarSuccess] = useState(false)

  // Quick Gate Pass State
  const [visitorName, setVisitorName] = useState('')
  const [visitorPurpose, setVisitorPurpose] = useState('Friend Visiting')
  const [generatedPassCode, setGeneratedPassCode] = useState<string | null>(null)

  // Instant hydrate from cache and load session with timeout guard
  useEffect(() => {
    let isMounted = true

    // 1. Instant local cache hydration (0ms latency, eliminates loading spinner)
    try {
      const cachedUserStr = localStorage.getItem('pgsetu_session_user')
      const cachedProfileStr = localStorage.getItem('pgsetu_profile_data')
      const cachedStaysStr = localStorage.getItem('pgsetu_session_stays')
      const cachedPropsStr = localStorage.getItem('pgsetu_hosted_properties')
      const cachedSummaryStr = localStorage.getItem('pgsetu_passbook_summary')

      if (cachedUserStr) {
        const u = JSON.parse(cachedUserStr)
        setCurrentUser(u)
        setEditName(u.full_name || '')
        if (u.role === 'owner' || u.role === 'superadmin' || u.role === 'manager') {
          setActiveTab('properties')
        }
        setLoading(false)
      }
      if (cachedProfileStr) {
        const p = JSON.parse(cachedProfileStr)
        setProfileData(p)
        setEditDob(p.dob || '')
        setEditGender(p.gender || 'male')
        setLoading(false)
      }
      if (cachedStaysStr) setStays(JSON.parse(cachedStaysStr))
      if (cachedPropsStr) setHostedProperties(JSON.parse(cachedPropsStr))
      if (cachedSummaryStr) setPassbookSummary(JSON.parse(cachedSummaryStr))
    } catch {}

    // 2. Maximum 2s timeout guard to prevent infinite loader
    const timeoutId = setTimeout(() => {
      if (isMounted) setLoading(false)
    }, 2000)

    async function loadSession() {
      try {
        const res = await fetch('/api/auth/session', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (!isMounted) return
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setCurrentUser(data.user)
            setEditName(data.user.full_name || '')
            const safeEmail = data.user.email && !data.user.email.includes('@owner.pgsetu.') && !data.user.email.includes('@user.pgsetu.') && !data.user.email.includes('@resident.pgsetu.') && !data.user.email.includes('@pgsetu.online')
              ? data.user.email
              : ''
            setEditEmail(safeEmail)
            if (data.stays) setStays(data.stays)
            if (data.passbookSummary) setPassbookSummary(data.passbookSummary)
            if (data.transactions) setTransactions(data.transactions)

            if (data.hostedProperties && data.hostedProperties.length > 0) {
              setHostedProperties(data.hostedProperties)
            } else {
              setHostedProperties([])
            }
            if (data.propertyStats) setPropertyStats(data.propertyStats)
            const isHostRole = data.user.role === 'owner' || data.user.role === 'superadmin' || data.user.role === 'manager'
            if (isHostRole) {
              setActiveTab('properties')
            }

            // Superadmin is always unlocked; owner is unlocked only if verified
            const isUnlocked = data.isOwnerUnlocked ?? Boolean(data.user.organization_id)
            setIsOwnerUnlockedState(isUnlocked)

            // Server profile is the authoritative source of truth
            const serverProfile = data.profile || {}
            setProfileData(serverProfile)
            try {
              localStorage.setItem('pgsetu_session_user', JSON.stringify(data.user))
              localStorage.setItem('pgsetu_profile_data', JSON.stringify(serverProfile))
              if (data.stays) localStorage.setItem('pgsetu_session_stays', JSON.stringify(data.stays))
              if (data.hostedProperties) localStorage.setItem('pgsetu_hosted_properties', JSON.stringify(data.hostedProperties))
              if (data.passbookSummary) localStorage.setItem('pgsetu_passbook_summary', JSON.stringify(data.passbookSummary))
            } catch {}

            setEditDob(serverProfile.dob || '')
            setEditGender(serverProfile.gender || 'male')
            setEditAge(serverProfile.age ? serverProfile.age.toString() : '')
            setEditProfession(serverProfile.profession || '')
            setEditCollegeCompany(serverProfile.college_or_company || '')
            setEditEmergencyName(serverProfile.emergency_name || '')
            setEditEmergencyPhone(serverProfile.emergency_phone || '')
            setEditEmergencyRelation(serverProfile.emergency_relation || 'Parent')
            setEditPermanentAddress(serverProfile.permanent_address || '')
            setEditPermanentCity(serverProfile.permanent_city || '')
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err)
      } finally {
        clearTimeout(timeoutId)
        if (isMounted) setLoading(false)
      }
    }
    loadSession()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  // Open 10-Step List Property Wizard (Modal shown in screenshot media_1789545136103.jpg)
  const handleOpenAddProperty = () => {
    // If resident or tenant, redirect them to login page immediately
    if (currentUser && ['resident', 'tenant', 'user'].includes(currentUser.role)) {
      router.push('/login?role=owner')
      return
    }

    // Property listing gatekeeper: Owner must be onboarded/unlocked by SuperAdmin before listing properties
    const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.email === 'vikramtomar0505@gmail.com'
    if (!isSuperAdmin && currentUser?.role === 'owner' && !isOwnerUnlockedState) {
      setIsListingLockedModalOpen(true)
      return
    }

    setIsListPropertyWizardOpen(true)
  }

  // Handle callback when 10-step wizard completes and creates a listing
  const handleWizardListingCreated = async (formData: any) => {
    try {
      const res = await fetch('/api/properties/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_new: true,
          organization_id: currentUser?.organization_id,
          name: formData.propertyName,
          phone: formData.ownerPhone || currentUser?.phone,
          email: formData.ownerEmail || currentUser?.email,
          address: formData.fullAddress || formData.locality || '',
          city: formData.city,
          state: '',
          pincode: formData.pincode || '',
          description: formData.tagline || '',
          starting_rent_paise: Number(formData.rentMonthly || 0) * 100,
          notice_period_days: Number(formData.noticePeriodDays || 30),
          gate_closing_time: formData.gateClosingTime || '11:00 PM',
          amenities: formData.amenities || [],
          rules: [
            `Gate closes at ${formData.gateClosingTime || '11:00 PM'}`,
            formData.visitorsAllowed ? 'Visitors allowed in common areas' : 'Visitors not allowed',
            formData.smokingAllowed ? 'Smoking permitted in designated zones' : 'Strictly no smoking',
            formData.drinkingAllowed ? 'Alcohol permitted' : 'Alcohol prohibited',
            formData.petFriendly ? 'Pet friendly premises' : 'No pets allowed',
          ].filter(Boolean),
          images: formData.imageUrls || [],
          coverImage: formData.imageUrls?.[0] || '',
        }),
      })

      if (res.ok) {
        const resData = await res.json()
        const returnedProp = resData.property
        const newEntry = {
          id: returnedProp?.id || `prop-${Date.now()}`,
          organization_id: returnedProp?.organization_id || currentUser?.organization_id,
          name: formData.propertyName,
          phone: formData.ownerPhone || currentUser?.phone,
          email: formData.ownerEmail || currentUser?.email,
          address: formData.fullAddress || formData.locality || '',
          city: formData.city,
          description: formData.tagline || '',
          settings: {
            starting_rent_paise: Number(formData.rentMonthly || 0) * 100,
            notice_period_days: Number(formData.noticePeriodDays || 30),
            gate_closing_time: formData.gateClosingTime || '11:00 PM',
            amenities: formData.amenities || [],
            images: formData.imageUrls || [],
            coverImage: formData.imageUrls?.[0] || '',
          },
        }
        setHostedProperties((prev) => [newEntry, ...(prev || [])])
        setActiveTab('properties')
      }
    } catch (e) {
      console.error('Failed to save listing from wizard:', e)
    }
  }

  const handleOpenPropertyModal = (prop?: any) => {
    const target = prop || null
    setEditingProperty(target)
    // For editing, use existing prop name; for new property, do not prefill phone number as name
    const orgName = currentUser?.organizations?.name
    const isPhoneOrgName = orgName && (orgName === currentUser?.phone || orgName.replace(/\D/g, '') === currentUser?.phone)
    const defaultName = target?.name || (!target && !isPhoneOrgName ? orgName : '') || ''
    setPropName(defaultName)
    setPropPhone(target?.phone || currentUser?.phone || '')
    setPropEmail(target?.email || currentUser?.email || '')
    setPropAddress(target?.address || '')
    setPropCity(target?.city || currentUser?.organizations?.city || '')
    setPropState(target?.state || '')
    setPropPincode(target?.pincode || '')
    setPropDescription(target?.description || '')
    const s = target?.settings || {}
    setPropPhotos(Array.isArray(s.images) && s.images.length > 0 ? s.images : [])
    setPropRent(s.starting_rent_paise ? String(Math.round(s.starting_rent_paise / 100)) : (s.starting_rent ? String(s.starting_rent) : '7500'))
    setPropNoticePeriod(s.notice_period_days ? String(s.notice_period_days) : '30')
    setPropLockIn(s.lock_in_months ? String(s.lock_in_months) : '3')
    setPropGateClosing(s.gate_closing_time || '11:00 PM')
    setPropUpiId(s.upi_id || currentUser?.organizations?.settings?.upi_id || '')
    if (Array.isArray(s.amenities) && s.amenities.length > 0) {
      setPropAmenities(s.amenities)
    } else {
      setPropAmenities([
        'High-Speed WiFi', 'Power Backup', 'RO Water', '3 Daily Meals', 'Air Conditioning', 'CCTV Security', 'Housekeeping', 'Washing Machine'
      ])
    }
    if (Array.isArray(s.rules) && s.rules.length > 0) {
      setPropRules(s.rules)
    } else {
      setPropRules([
        'Gate closes at 11:00 PM', 'Visitors in lounge only', 'No smoking inside rooms'
      ])
    }
    setPropSaveSuccess('')
    setPropSaveError('')
    setIsPropertyModalOpen(true)
  }

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProperty(true)
    setPropSaveError('')
    setPropSaveSuccess('')

    const isNew = !editingProperty?.id || editingProperty?.id === 'new'

    try {
      const res = await fetch('/api/properties/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: isNew ? undefined : editingProperty?.id,
          organization_id: editingProperty?.organization_id || currentUser?.organization_id,
          is_new: isNew,
          name: propName,
          phone: propPhone,
          email: propEmail,
          address: propAddress,
          city: propCity,
          state: propState,
          pincode: propPincode,
          description: propDescription,
          starting_rent_paise: Number(propRent) * 100,
          notice_period_days: Number(propNoticePeriod),
          lock_in_months: Number(propLockIn),
          gate_closing_time: propGateClosing,
          amenities: propAmenities,
          rules: propRules,
          upi_id: propUpiId,
          images: propPhotos,
          coverImage: propPhotos[0] || '',
        }),
      })

      const resData = await res.json()
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update property details.')
      }

      const returnedProp = resData.property
      const updated = {
        ...(editingProperty || {}),
        id: returnedProp?.id || editingProperty?.id || `prop-${Date.now()}`,
        organization_id: returnedProp?.organization_id || currentUser?.organization_id,
        name: propName,
        phone: propPhone,
        email: propEmail,
        address: propAddress,
        city: propCity,
        state: propState,
        pincode: propPincode,
        description: propDescription,
        settings: {
          ...(editingProperty?.settings || {}),
          starting_rent_paise: Number(propRent) * 100,
          notice_period_days: Number(propNoticePeriod),
          lock_in_months: Number(propLockIn),
          gate_closing_time: propGateClosing,
          amenities: propAmenities,
          rules: propRules,
          upi_id: propUpiId,
          images: propPhotos,
          coverImage: propPhotos[0] || '',
        },
      }

      setHostedProperties((prev) => {
        if (isNew) {
          return [updated, ...(prev || [])]
        }
        if (!prev || prev.length === 0) return [updated]
        return prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      })

      setPropSaveSuccess(isNew ? 'New PG Property listed and published live!' : 'Property details & terms updated live!')
      setTimeout(() => {
        setIsPropertyModalOpen(false)
        setPropSaveSuccess('')
      }, 1200)
    } catch (err: any) {
      setPropSaveError(err.message || 'Failed to save property.')
    } finally {
      setSavingProperty(false)
    }
  }

  const isOwner = currentUser?.role === 'owner' || currentUser?.role === 'superadmin' || currentUser?.role === 'manager'

  const uniqueId = isOwner
    ? (currentUser?.organization_id ? `HOST-${currentUser.organization_id.slice(-4).toUpperCase()}` : `HO-${currentUser?.phone?.slice(-4) || '001'}`)
    : (currentUser?.registration_number || profileData?.id || `TN-${currentUser?.phone?.slice(-4) || '2026'}-7AB`)

  const isAadhaarVerified = Boolean(profileData?.aadhaar_verified)
  const aadhaarLast4 = profileData?.aadhaar_last4 || ''
  const activeStay = stays.find((s) => s.status === 'active' && s.room_number) || null

  const totalRentFormatted = passbookSummary
    ? `₹${(passbookSummary.total_rent_paid_paise / 100).toLocaleString('en-IN')}`
    : '₹0'
  const activeDepositFormatted = passbookSummary
    ? `₹${(passbookSummary.active_deposits_paise / 100).toLocaleString('en-IN')}`
    : '₹0'
  const outstandingDueFormatted = passbookSummary
    ? `₹${(passbookSummary.total_due_paise / 100).toLocaleString('en-IN')}`
    : '₹0'

  const handleCopyId = (id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareIdCard = async () => {
    let shareText = ''
    if (isOwner) {
      const primaryProp = hostedProperties[0]?.name || 'PG-Setu Co-Living'
      shareText = `PG-Setu Certified Host Pass\nOwner / Host: ${currentUser?.full_name || 'PG Host'}\nHost ID: ${uniqueId}\nPrimary Property: ${primaryProp}\nListed Properties: ${hostedProperties.length}\nContact: +91 ${currentUser.phone || ''}\nVerification: Verified PG Owner`
    } else {
      const roomInfo = activeStay?.room_number
        ? `${activeStay.room_number}${activeStay.bed_label ? ` (${activeStay.bed_label})` : ''}`
        : 'Pending Room Allotment'
      shareText = `PG-Setu Digital Tenant Pass\nName: ${currentUser?.full_name || 'Tenant'}\nUniversal ID: ${uniqueId}\nStay: ${activeStay?.property_name || 'PG-Setu Network'}\nRoom: ${roomInfo}\nStatus: Verified Resident`
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: isOwner ? `${currentUser?.full_name || 'Host'} - PG-Setu Owner Pass` : `${currentUser?.full_name || 'Member'} - PG-Setu Tenant Pass`,
          text: shareText,
          url: window.location.href,
        })
        return
      } catch {}
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
      setSharedToast(true)
      setTimeout(() => setSharedToast(false), 2500)
    }
  }

  const handleDownloadReceipt = (receiptId: string) => {
    setReceiptDownloaded(receiptId)
    setTimeout(() => setReceiptDownloaded(null), 3000)
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    localStorage.removeItem('pgsetu_profile_id')
    localStorage.removeItem('pgsetu_profile_data')
    window.location.href = '/'
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEdit(true)
    setSaveSuccessMsg('')

    const updatedProfilePayload = {
      full_name: editName.trim(),
      email: editEmail.trim(),
      dob: editDob,
      gender: editGender,
      age: Number(editAge) || undefined,
      profession: editProfession.trim(),
      college_or_company: editCollegeCompany.trim(),
      emergency_name: editEmergencyName.trim(),
      emergency_phone: editEmergencyPhone.trim(),
      emergency_relation: editEmergencyRelation,
      permanent_address: editPermanentAddress.trim(),
      permanent_city: editPermanentCity.trim(),
    }

    try {
      // 1. Persist to server API (Supabase & Firestore)
      const res = await fetch('/api/profiles/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfilePayload),
      })

      if (res.ok) {
        const resData = await res.json()
        if (resData.profile) {
          setProfileData(resData.profile)
          if (resData.profile.dob) setEditDob(resData.profile.dob)
          setEditGender(resData.profile.gender || 'male')
          setEditAge(resData.profile.age ? resData.profile.age.toString() : '')
          setEditProfession(resData.profile.profession || '')
          setEditCollegeCompany(resData.profile.college_or_company || '')
          setEditEmergencyName(resData.profile.emergency_name || '')
          setEditEmergencyPhone(resData.profile.emergency_phone || '')
          setEditEmergencyRelation(resData.profile.emergency_relation || 'Parent')
          setEditPermanentAddress(resData.profile.permanent_address || '')
          setEditPermanentCity(resData.profile.permanent_city || '')
          try {
            localStorage.setItem('pgsetu_profile_data', JSON.stringify(resData.profile))
          } catch {}
        }
        if (resData.user) {
          setCurrentUser((prev: any) => ({
            ...(prev || {}),
            ...resData.user,
          }))
        }
        setSaveSuccessMsg('Profile saved to database successfully!')
      } else {
        const errJson = await res.json().catch(() => ({}))
        setSaveSuccessMsg(errJson.error || 'Saved locally (offline mode)')
      }
    } catch (err) {
      console.warn('[Profile Save warning]:', err)
      setSaveSuccessMsg('Saved locally')
    }

    setSavingEdit(false)
    setTimeout(() => {
      setIsEditing(false)
      setSaveSuccessMsg('')
    }, 1200)
  }

  const handleConfirmAadhaar = async () => {
    setVerifyingAadhaar(true)
    const last4 = aadhaarInput.slice(-4) || ''

    try {
      await fetch('/api/profiles/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aadhaar_verified: true,
          aadhaar_last4: last4,
        }),
      })
    } catch {}

    setAadhaarSuccess(true)
    const updated = {
      ...(profileData || {}),
      aadhaar_verified: true,
      aadhaar_last4: last4,
      aadhaar_verified_date: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    }
    setProfileData(updated)
    try {
      localStorage.setItem('pgsetu_profile_data', JSON.stringify(updated))
    } catch {}
    setVerifyingAadhaar(false)

    setTimeout(() => {
      setIsAadhaarModalOpen(false)
      setAadhaarSuccess(false)
      setAadhaarOtpSent(false)
    }, 1500)
  }

  const handleGenerateGatePass = (e: React.FormEvent) => {
    e.preventDefault()
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedPassCode(code)
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((txn) => {
    if (txnFilter === 'all') return true
    if (txnFilter === 'rent') return txn.description?.toLowerCase().includes('rent')
    if (txnFilter === 'deposit') return txn.description?.toLowerCase().includes('deposit')
    if (txnFilter === 'electricity') return txn.description?.toLowerCase().includes('electricity')
    return true
  })

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAF7] px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-[#16A34A]" />
          <span className="text-xs text-gray-500 font-semibold tracking-wide">
            Loading your verified profile & passbook...
          </span>
          <button
            type="button"
            onClick={() => setLoading(false)}
            className="mt-2 text-xs text-[#16A34A] hover:underline font-semibold cursor-pointer"
          >
            Click to open profile now
          </button>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FAF7] p-4 text-center">
        <div className="max-w-md w-full rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gray-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#14532D]">
            <User className="h-7 w-7 text-[#16A34A]" />
          </div>
          <h2 className="mt-4 text-lg sm:text-xl font-black text-gray-900">Sign In to View Your Profile</h2>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            Log in with your 10-digit mobile number to view your Universal Tenant ID, digital rent passbook, and verified stay records.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-95 transition"
            >
              <span>Sign In with Mobile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-900"
            >
              ← Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7FAF7] pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]">
      {/* ---------------------------------------------------------- */}
      {/* 1. MOBILE-FIRST TOP APP BAR */}
      {/* ---------------------------------------------------------- */}
      <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 sm:h-16 max-w-5xl items-center justify-between px-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#14532D] to-[#16A34A] text-white shadow-xs"
              title="Return to Home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <span className="text-sm sm:text-base font-black text-[#14532D] tracking-tight block">
                {isOwner ? 'PG Owner & Host Portal' : 'PG-Setu Member'}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold block sm:hidden">
                {isOwner ? `Host ID: ${uniqueId.slice(0, 12)}` : `Universal ID: ${uniqueId.slice(0, 10)}...`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleOpenAddProperty}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Add Property</span>
                </button>
                <a
                  href="/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Owner ERP</span>
                  <ExternalLink className="h-3 w-3 opacity-80" />
                </a>
              </div>
            ) : (
              <Link
                href="/portal"
                className="inline-flex items-center gap-1 rounded-xl bg-[#DCFCE7] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-[#14532D] shadow-xs"
              >
                <KeyRound className="h-3 w-3 text-[#16A34A]" />
                <span>Portal</span>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-3 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* ---------------------------------------------------------- */}
        {/* 2. DIGITAL TENANT / HOST ID CARD (SMART PASS)             */}
        {/* ---------------------------------------------------------- */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D3B1E] via-[#14532D] to-[#1E3A8A] p-4 sm:p-6 text-white shadow-lg shadow-emerald-950/20">
          {/* Background Decorative Rings */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-emerald-400/10 blur-2xl" />

          {/* Card Top Strip */}
          <div className="flex items-center justify-between pb-3 border-b border-white/15 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold uppercase tracking-widest text-[10px]">
              {isOwner ? (
                <>
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Verified Property Host & PG Owner Pass</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Universal Tenant Identity Pass</span>
                </>
              )}
            </div>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-xs text-white">
              {isOwner ? 'PG Owner & Certified Host' : 'Verified Resident'}
            </span>
          </div>

          {/* Card Main Body */}
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Avatar with Verified Badge */}
              <div className="relative shrink-0">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white text-[#14532D] text-xl sm:text-2xl font-black shadow-md ring-2 ring-emerald-300/40">
                  {((currentUser.full_name || currentUser.name || (hostedProperties[0]?.name ? hostedProperties[0].name : 'H')))[0].toUpperCase()}
                </div>
                {isAadhaarVerified && (
                  <div
                    title="DigiLocker Aadhaar Verified"
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 ring-2 ring-[#14532D] shadow-xs"
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* User/Host Details */}
              <div className="space-y-0.5">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>
                    {isOwner
                      ? (currentUser.full_name || (hostedProperties[0]?.name && hostedProperties[0].name !== currentUser.phone ? hostedProperties[0].name : 'PG Owner & Certified Host'))
                      : (currentUser.full_name || 'PG-Setu Member')}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="h-3 w-3" />
                    {isOwner ? 'Verified Host' : 'KYC Verified'}
                  </span>
                </h1>
                <p className="text-xs text-emerald-200/90 font-medium">
                  {isOwner
                    ? `${hostedProperties.length} Listed ${hostedProperties.length === 1 ? 'Property' : 'Properties'} • ${hostedProperties[0]?.city || currentUser?.organizations?.city || 'Verified PG Host'}`
                    : `${profileData?.profession || 'Verified Member'} • ${activeStay?.city || 'PG-Setu Resident'}`}
                </p>
                <p className="text-[11px] text-white/70 font-mono">
                  +91 {currentUser.phone || profileData?.mobile || 'Verified Mobile'}
                </p>
              </div>
            </div>

            {/* Universal ID Box */}
            <div className="w-full sm:w-auto rounded-2xl bg-black/25 backdrop-blur-md p-3 border border-white/10 flex items-center justify-between sm:justify-end gap-3">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300/80 block">
                  {isOwner ? 'PG Owner Host ID' : 'Unique Tenant ID'}
                </span>
                <span className="font-mono text-xs sm:text-sm font-black tracking-wide text-white block">
                  {uniqueId}
                </span>
              </div>
              <button
                onClick={() => handleCopyId(uniqueId)}
                className="flex items-center gap-1 rounded-xl bg-white/15 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/25 active:scale-95 transition cursor-pointer"
                title="Copy ID"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span className="text-[10px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-emerald-200" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Current Stay or Hosted Property Footer */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-200 text-[11px]">
              {isOwner ? (
                <>
                  <Building2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                  <span className="font-semibold text-white">
                    {hostedProperties[0]?.name || currentUser?.organizations?.name || 'Hosted Properties'}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="font-bold text-emerald-300">
                    {propertyStats?.total_residents ?? 0} Residents ({propertyStats?.total_rooms ?? 0} Rooms, {propertyStats?.total_beds ?? 0} Beds)
                  </span>
                </>
              ) : (
                <>
                  <Home className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                  <span className="font-semibold text-white">
                    {activeStay?.property_name || 'PG-Setu Member'}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="font-bold text-emerald-300">
                    {activeStay?.room_number
                      ? `${activeStay.room_number} (${activeStay.bed_label || 'Bed A'})`
                      : 'No Active PG Allotted'}
                  </span>
                </>
              )}
            </div>

            {/* Quick Card Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
              {isOwner ? (
                <>
                  <button
                    onClick={handleOpenAddProperty}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-400 text-emerald-950 px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-300 active:scale-95 transition shadow-xs cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>+ Add Property</span>
                  </button>
                  {hostedProperties.length > 0 && (
                    <button
                      onClick={() => handleOpenPropertyModal(hostedProperties[0])}
                      className="inline-flex items-center gap-1 rounded-xl bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/30 active:scale-95 transition cursor-pointer"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit Property</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/30 active:scale-95 transition cursor-pointer"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/25 active:scale-95 transition cursor-pointer"
              >
                <QrCode className="h-3 w-3 text-emerald-300" />
                <span>Show QR</span>
              </button>
              <button
                onClick={handleShareIdCard}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/30 border border-emerald-400/30 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/40 active:scale-95 transition cursor-pointer"
              >
                <Share2 className="h-3 w-3" />
                <span>Share ID</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2B. GATED OWNER ONBOARDING WARNING (IF ERP / LISTING LOCKED) */}
        {isOwner && !isOwnerUnlockedState && (
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/95 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 shadow-inner">
                <Lock className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-amber-950">
                    Owner Onboarding Pending — ERP Platform & Listing Locked
                  </h3>
                  <span className="rounded-full bg-amber-200/90 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 uppercase tracking-wider">
                    Verification Review
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-700 leading-relaxed">
                  Your owner profile is registered. To ensure quality listings, full ERP access and property listing on the website will unlock once our Verification Team reviews your account and finishes your PG onboarding.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={`https://wa.me/919453522757?text=${encodeURIComponent(
                      `Hello Operations Team, I registered as a PG Owner on PGSetu (${currentUser?.full_name || 'Owner'}, Mobile: +91 ${currentUser?.phone || ''}). Please finish my onboarding and unlock my ERP platform.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Chat with Support to Unlock</span>
                  </a>
                  <a
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-50 transition"
                  >
                    <Lock className="h-3.5 w-3.5 text-amber-700" />
                    <span>View Locked ERP Screen</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/* 3. MOBILE QUICK ACTION DOCK (ROLE-ADAPTIVE 4 TOUCH PILLS) */}
        {/* ---------------------------------------------------------- */}
        {isOwner ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {/* 1. Add Property Modal */}
            <button
              onClick={handleOpenAddProperty}
              className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-emerald-200 shadow-xs hover:border-emerald-400 active:scale-95 transition text-center group cursor-pointer"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-[#14532D] group-hover:text-white transition">
                <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1">
                + Add Property
              </span>
              <span className="text-[9px] text-gray-400 hidden sm:block">List New PG</span>
            </button>

            {/* 2. Quick Edit Property Modal */}
            <button
              onClick={() => handleOpenPropertyModal(hostedProperties[0] || null)}
              className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group cursor-pointer"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1">
                Edit Property
              </span>
              <span className="text-[9px] text-gray-400 hidden sm:block">Rates & Rules</span>
            </button>

            {/* 3. Owner ERP Dashboard */}
            <a
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1 flex items-center justify-center gap-0.5">
                Owner ERP <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </span>
              <span className="text-[9px] text-gray-400 hidden sm:block">Full Dashboard</span>
            </a>

            {/* 4. Residents CRM */}
            <a
              href="/dashboard/residents"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1 flex items-center justify-center gap-0.5">
                Residents CRM <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </span>
              <span className="text-[9px] text-gray-400 hidden sm:block">Check-in & KYC</span>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {/* Quick Pay Rent */}
            <button
              onClick={() => setIsUpiPayModalOpen(true)}
              className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group cursor-pointer"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1">
                Pay Rent
              </span>
              <span className="text-[9px] text-gray-400 hidden sm:block">Instant UPI</span>
            </button>

            {/* Quick Gate Pass */}
            <button
              onClick={() => setIsGatePassModalOpen(true)}
              className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group cursor-pointer"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition">
                <KeyRound className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1">
                Gate Pass
              </span>
              <span className="text-[9px] text-gray-400 hidden sm:block">Visitor Code</span>
            </button>

            {/* Receipts / HRA */}
            <Link
              href="/portal?tab=hra"
              className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1">
                HRA Kit
              </span>
              <span className="text-[9px] text-gray-400 hidden sm:block">Rent Receipts</span>
            </Link>

            {/* Warden / Support */}
            <a
              href="https://wa.me/919453522757?text=Hi%20PG-Setu%20Support,%20I%20need%20assistance%20with%20my%20stay"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center rounded-2xl bg-white p-2.5 sm:p-3.5 border border-gray-200/80 shadow-xs hover:border-emerald-300 active:scale-95 transition text-center group"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition">
                <HeartHandshake className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-gray-800 line-clamp-1">
                Helpdesk
              </span>
              <span className="text-[9px] text-gray-400 hidden sm:block">Warden Chat</span>
            </a>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/* 4. MOBILE-FIRST SEGMENTED TABS BAR */}
        {/* ---------------------------------------------------------- */}
        <div className="flex rounded-2xl bg-gray-200/70 p-1 gap-1 overflow-x-auto no-scrollbar">
          {isOwner ? (
            <>
              <button
                onClick={() => setActiveTab('properties')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'properties'
                    ? 'bg-white text-[#14532D] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>My Properties ({hostedProperties.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-white text-[#14532D] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Business Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('kyc')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'kyc'
                    ? 'bg-white text-[#14532D] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>KYC & Payout Details</span>
              </button>

              {stays.length > 0 && (
                <button
                  onClick={() => setActiveTab('stays')}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === 'stays'
                      ? 'bg-white text-[#14532D] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>Personal Stays ({stays.length})</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-white text-[#14532D] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('passbook')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'passbook'
                    ? 'bg-white text-[#14532D] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Passbook</span>
              </button>

              <button
                onClick={() => setActiveTab('stays')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'stays'
                    ? 'bg-white text-[#14532D] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Stays ({stays.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('kyc')}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'kyc'
                    ? 'bg-white text-[#14532D] shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>KYC & Info</span>
              </button>
            </>
          )}
        </div>

        {/* ---------------------------------------------------------- */}
        {/* TAB 0: HOSTED PROPERTIES & LIVE PROPERTY EDITOR (OWNERS)   */}
        {/* ---------------------------------------------------------- */}
        {activeTab === 'properties' && (
          <div className="space-y-4">
            {/* Host KPI Micro-Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Total Capacity */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Total Capacity
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <BedDouble className="h-3 w-3" />
                  </div>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-gray-900">
                  {propertyStats?.total_beds ?? 0} Beds
                </div>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Across {propertyStats?.total_rooms ?? 0} Rooms
                </span>
              </div>

              {/* Active Residents */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Occupancy
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Users className="h-3 w-3" />
                  </div>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-blue-900">
                  {propertyStats?.total_residents ?? 0} Residents
                </div>
                <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                  {propertyStats?.total_beds ? Math.round(((propertyStats.total_residents || 0) / propertyStats.total_beds) * 100) : 0}% Occupancy
                </span>
              </div>

              {/* Vacant / Available Beds */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Vacant Beds
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                    <Bed className="h-3 w-3" />
                  </div>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-amber-900">
                  {propertyStats?.available_beds ?? 0} Available
                </div>
                <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                  Ready to book
                </span>
              </div>

              {/* Monthly Expected Revenue */}
              <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Expected Rent
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-[#14532D]">
                  ₹{((propertyStats?.expected_revenue_paise ?? 0) / 100).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                  Monthly Run Rate
                </span>
              </div>
            </div>

            {/* Properties List Header */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-1.5">
                  <span>Hosted Properties</span>
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-[#14532D]">
                    {hostedProperties.length} Listed
                  </span>
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-500">
                  Manage live listing details, house rules, rent tariffs, and security deposit terms.
                </p>
              </div>

              <button
                onClick={handleOpenAddProperty}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ List New Property</span>
              </button>
            </div>

            {deleteSuccess && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-[#14532D] border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{deleteSuccess}</span>
              </div>
            )}

            {/* Hosted Properties Cards or Empty State */}
            {hostedProperties.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#14532D]">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">No Hosted Properties Yet</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  You haven&apos;t listed any properties yet. Click below to add your first PG or hostel property and manage rooms, beds, and residents.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleOpenAddProperty}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-4 py-2 text-xs font-bold text-white hover:bg-[#166534] transition active:scale-95 shadow-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>List New Property</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              {hostedProperties.map((prop, idx) => {
                const s = prop.settings || {}
                const rentFormatted = s.starting_rent_paise
                  ? `₹${Math.round(s.starting_rent_paise / 100).toLocaleString('en-IN')}`
                  : (s.starting_rent ? `₹${Number(s.starting_rent).toLocaleString('en-IN')}` : '₹7,500')
                const amenitiesList: string[] = Array.isArray(s.amenities) && s.amenities.length > 0
                  ? s.amenities
                  : ['High-Speed WiFi', 'Power Backup', 'RO Water', '3 Daily Meals', 'Air Conditioning', 'CCTV Security']
                const rulesList: string[] = Array.isArray(s.rules) && s.rules.length > 0
                  ? s.rules
                  : ['Gate closes at 11:00 PM', 'Visitors in lounge only', 'No smoking inside rooms']

                return (
                  <div
                    key={prop.id || idx}
                    className="rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-4"
                  >
                    {/* Header: Title + Status + Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-black text-gray-900">
                            {prop.name || 'PG-Setu Residence'}
                          </h3>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-[#14532D] flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Live & Verified
                          </span>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            Auto-Sync Supabase
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span>
                            {prop.address ? `${prop.address}, ` : ''}{prop.city || ''}{prop.state ? `, ${prop.state}` : ''}{prop.pincode ? ` - ${prop.pincode}` : ''}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingProperty(prop)
                            setDeleteError('')
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Property</span>
                        </button>
                        <button
                          onClick={() => handleOpenPropertyModal(prop)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#14532D] hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit Details</span>
                        </button>
                        <a
                          href="/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#166534] transition active:scale-95 shadow-xs"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Open ERP ↗</span>
                        </a>
                      </div>
                    </div>

                    {/* Photos Gallery Strip if available */}
                    {Array.isArray(s.images) && s.images.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-gray-600 flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Property Photos ({s.images.length})</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {s.images.length >= 5 ? '✓ 5+ Photos Verified' : `${s.images.length}/5 Photos`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {s.images.map((imgUrl: string, pIdx: number) => (
                            <div
                              key={pIdx}
                              className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 group shadow-2xs"
                            >
                              <img
                                src={imgUrl}
                                alt={`Property photo ${pIdx + 1}`}
                                className="h-full w-full object-cover group-hover:scale-105 transition"
                              />
                              {pIdx === 0 && (
                                <span className="absolute bottom-1 left-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-extrabold text-white backdrop-blur-xs">
                                  Cover
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {prop.description && (
                      <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                        {prop.description}
                      </p>
                    )}

                    {/* Key Property Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#F7FAF7] border border-emerald-100/60">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block">Starting Rent</span>
                        <span className="text-sm font-black text-[#14532D]">{rentFormatted} /mo</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F7FAF7] border border-emerald-100/60">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block">Notice Period</span>
                        <span className="text-sm font-black text-gray-800">{s.notice_period_days || 30} Days</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F7FAF7] border border-emerald-100/60">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block">Lock-In Period</span>
                        <span className="text-sm font-black text-gray-800">{s.lock_in_months || 3} Months</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F7FAF7] border border-emerald-100/60">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block">Gate Closing</span>
                        <span className="text-sm font-black text-gray-800">{s.gate_closing_time || '11:00 PM'}</span>
                      </div>
                    </div>

                    {/* UPI Auto Collection Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                          <Zap className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-[#14532D] block text-xs">Direct UPI Collection ID</span>
                          <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                            {s.upi_id || prop.upi_id || 'Configured via Owner ERP Settings'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-700 bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200 w-fit">
                        0% Commission Direct Settlement
                      </span>
                    </div>

                    {/* Amenities Chips */}
                    <div>
                      <span className="text-[11px] font-bold text-gray-600 block uppercase tracking-wider mb-2">
                        Verified Amenities ({amenitiesList.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {amenitiesList.map((amenity, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700"
                          >
                            <Check className="h-3 w-3 text-emerald-600" />
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* House Rules */}
                    <div>
                      <span className="text-[11px] font-bold text-gray-600 block uppercase tracking-wider mb-2">
                        House Rules & Code of Conduct
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {rulesList.map((rule, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/60 px-2.5 py-1 text-[11px] font-semibold text-amber-900"
                          >
                            <Shield className="h-3 w-3 text-amber-600" />
                            {rule}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Management Quick Sub-Routes (All Open in New Tab) */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-gray-500 font-medium">
                        Quick ERP Access:
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href="/dashboard/rooms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                        >
                          <BedDouble className="h-3 w-3" />
                          <span>Rooms & Tariffs ↗</span>
                        </a>
                        <a
                          href="/dashboard/residents"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                        >
                          <Users className="h-3 w-3" />
                          <span>Tenants CRM ↗</span>
                        </a>
                        <a
                          href="/dashboard/billing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                        >
                          <Receipt className="h-3 w-3" />
                          <span>Billing & Rent ↗</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}

                {/* Add Another PG Property Dashed Card */}
                <button
                  type="button"
                  onClick={handleOpenAddProperty}
                  className="w-full rounded-3xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 p-5 sm:p-6 flex flex-col items-center justify-center gap-2 transition group cursor-pointer"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#14532D] shadow-xs group-hover:scale-110 transition">
                    <Plus className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-black text-[#14532D]">
                    + List Another PG / Hostel Property
                  </span>
                  <span className="text-xs text-emerald-800 text-center max-w-md">
                    Add new buildings, boys/girls wings, or co-living flats under your owner account with dedicated room tariffs and live search sync.
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/* TAB 1: OVERVIEW & SMART PASSBOOK METRICS                   */}
        {/* ---------------------------------------------------------- */}
        {activeTab === 'overview' && (
          isOwner ? (
            <div className="space-y-4">
              {/* Host Portfolio KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Hosted Properties
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Building2 className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-black text-gray-900">
                    {hostedProperties.length} Listed
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                    Live on Marketplace
                  </span>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Total Capacity
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <BedDouble className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-black text-blue-900">
                    {propertyStats?.total_beds ?? 0} Beds
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                    Across {propertyStats?.total_rooms ?? 0} Rooms
                  </span>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Active Occupancy
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                      <Users className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-black text-amber-900">
                    {propertyStats?.total_residents ?? 0} Residents
                  </div>
                  <span className="text-[10px] text-amber-600 font-bold block mt-0.5">
                    {propertyStats?.available_beds ?? 0} Beds Available
                  </span>
                </div>

                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Monthly Run Rate
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                      <TrendingUp className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-black text-[#14532D]">
                    ₹{((propertyStats?.expected_revenue_paise ?? 0) / 100).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                    Expected Rent
                  </span>
                </div>
              </div>

              {/* Primary Property Quick Card */}
              {hostedProperties.length > 0 ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-xs font-black text-[#14532D] uppercase tracking-wide">
                        Primary Hosted Property
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">
                      ID: {hostedProperties[0]?.id ? String(hostedProperties[0].id).slice(0, 8) : 'PRO-001'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-gray-900">{hostedProperties[0]?.name || 'PG-Setu Residence'}</h3>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span>{hostedProperties[0]?.address ? `${hostedProperties[0].address}, ` : ''}{hostedProperties[0]?.city || ''}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenPropertyModal(hostedProperties[0])}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-white px-3 py-2 text-xs font-bold text-[#14532D] hover:bg-emerald-50 transition cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit Details</span>
                      </button>
                      <button
                        onClick={handleOpenAddProperty}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] active:scale-95 transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>+ Add Property</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-100/80 text-xs">
                    <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Starting Rent</span>
                      <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                        ₹{(hostedProperties[0]?.settings?.starting_rent_paise ? hostedProperties[0].settings.starting_rent_paise / 100 : (hostedProperties[0]?.settings?.starting_rent || 7500)).toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Notice Period</span>
                      <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                        {hostedProperties[0]?.settings?.notice_period_days || 30} Days
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Lock-In</span>
                      <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                        {hostedProperties[0]?.settings?.lock_in_months || 3} Months
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Direct UPI VPA</span>
                      <span className="font-bold text-[#14532D] text-xs mt-0.5 block truncate">
                        {hostedProperties[0]?.settings?.upi_id || currentUser?.organizations?.settings?.upi_id || 'Configured in ERP'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/60 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-gray-900">No Properties Listed Yet</h3>
                  <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                    List your PG or hostel to manage rooms, beds, check-ins, and direct rent collections.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={handleOpenAddProperty}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>List First Property</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Owner ERP Quick Access Grid */}
              <div className="rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-5 space-y-3">
                <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider">
                  Owner ERP Command Center
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <a
                    href="/dashboard/rooms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 hover:bg-emerald-50 border border-gray-200/80 hover:border-emerald-300 p-3 text-center transition group"
                  >
                    <BedDouble className="h-5 w-5 text-emerald-700 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-gray-800">Rooms & Tariffs</span>
                    <span className="text-[10px] text-gray-400">Bed Allocation ↗</span>
                  </a>

                  <a
                    href="/dashboard/residents"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 hover:bg-emerald-50 border border-gray-200/80 hover:border-emerald-300 p-3 text-center transition group"
                  >
                    <Users className="h-5 w-5 text-purple-700 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-gray-800">Residents CRM</span>
                    <span className="text-[10px] text-gray-400">Check-in & KYC ↗</span>
                  </a>

                  <a
                    href="/dashboard/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 hover:bg-emerald-50 border border-gray-200/80 hover:border-emerald-300 p-3 text-center transition group"
                  >
                    <Receipt className="h-5 w-5 text-blue-700 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-gray-800">Billing & Rent</span>
                    <span className="text-[10px] text-gray-400">Auto Invoicing ↗</span>
                  </a>

                  <a
                    href="/dashboard/electricity"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 hover:bg-emerald-50 border border-gray-200/80 hover:border-emerald-300 p-3 text-center transition group"
                  >
                    <Zap className="h-5 w-5 text-amber-600 mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-bold text-gray-800">Smart Meters</span>
                    <span className="text-[10px] text-gray-400">EB Readings ↗</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* KPI Metric Micro-Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* Lifetime Rent */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Rent Paid
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Receipt className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-black text-gray-900">
                    {totalRentFormatted}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Across {stays.length} stays
                  </span>
                </div>

                {/* Escrow Deposit */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Deposit
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Shield className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-black text-[#14532D]">
                    {activeDepositFormatted}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                    100% Escrow
                  </span>
                </div>

                {/* Pending Bills */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Pending
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-black text-emerald-600">
                    {outstandingDueFormatted}
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    All dues cleared
                  </span>
                </div>

                {/* Renter Credit Score */}
                <div className="rounded-2xl border border-gray-200/80 bg-white p-3 sm:p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Credit Score
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                      <Award className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="mt-1 text-base sm:text-lg font-black text-purple-900">
                    {passbookSummary?.renter_credit_score && passbookSummary.renter_credit_score !== 'N/A'
                      ? passbookSummary.renter_credit_score
                      : '0 / 100'}
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 block mt-0.5">
                    {passbookSummary?.renter_tier || 'New Tenant'}
                  </span>
                </div>
              </div>

              {/* Active Stay Detailed Highlight or Empty State */}
              {activeStay ? (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-xs font-black text-[#14532D] uppercase tracking-wide">
                        Currently Active Stay
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-800 font-bold">
                      Ref: {activeStay.registration_number || uniqueId}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-gray-900">{activeStay.property_name}</h3>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span>{activeStay.address || activeStay.city}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsUpiPayModalOpen(true)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] active:scale-95 transition"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Pay Due</span>
                      </button>
                      <Link
                        href="/portal?tab=gatepass"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Gate Pass</span>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-100/80 text-xs">
                    <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Room & Bed</span>
                      <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                        {activeStay.room_number ? `${activeStay.room_number} • ${activeStay.bed_label || 'Bed A'}` : 'Pending Allotment'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Monthly Rent</span>
                      <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                        {activeStay.monthly_rent_paise ? `₹${((activeStay.monthly_rent_paise) / 100).toLocaleString('en-IN')}` : '₹0'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Check-In</span>
                      <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                        {activeStay.check_in_date || 'Pending'}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/80 p-2 border border-emerald-100">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Escrow Deposit</span>
                      <span className="font-bold text-[#14532D] text-xs mt-0.5 block">
                        {activeStay.deposit_held_paise ? `₹${((activeStay.deposit_held_paise) / 100).toLocaleString('en-IN')}` : '₹0'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty State when no active stay is allotted */
                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/60 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-gray-900">No Active PG Allotment</h3>
                  <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                    You are not currently allotted to any PG. Your PG owner or property manager will allot your room and bed upon check-in.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition"
                    >
                      <span>Explore Verified PGs</span>
                    </Link>
                    <a
                      href="https://wa.me/919453522757?text=Hi%20PG-Setu,%20please%20help%20me%20with%20my%20stay%20allotment"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span>Contact Support</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ---------------------------------------------------------- */}
        {/* TAB 2: PASSBOOK TRANSACTIONS (NATIVE MOBILE CARDS) */}
        {/* ---------------------------------------------------------- */}
        {activeTab === 'passbook' && (
          <div className="space-y-3">
            {/* Filter Pills */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
              <div className="flex items-center gap-1.5">
                {(['all', 'rent', 'deposit', 'electricity'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setTxnFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      txnFilter === filterKey
                        ? 'bg-[#14532D] text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {filterKey}
                  </button>
                ))}
              </div>

              <Link
                href="/portal?tab=ledger"
                className="text-xs font-bold text-[#14532D] hover:underline shrink-0"
              >
                Full Ledger →
              </Link>
            </div>

            {/* Mobile Native Transaction Cards */}
            <div className="space-y-2.5">
              {filteredTransactions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/60 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-gray-900">No Transactions Found</h3>
                  <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                    Rent receipts, utility adjustments, and deposit clearances will appear here once recorded.
                  </p>
                </div>
              ) : (
                filteredTransactions.map((txn: any) => {
                  const isRefund = txn.amount_paise < 0
                  return (
                    <div
                      key={txn.id}
                      className="rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-xs hover:border-gray-300 transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              isRefund
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            <Receipt className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 leading-snug">
                              {txn.description}
                            </h4>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {txn.property} • {txn.date}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-black block ${
                              isRefund ? 'text-blue-700' : 'text-gray-900'
                            }`}
                          >
                            {isRefund ? '-' : ''}₹{Math.abs(txn.amount_paise / 100).toLocaleString('en-IN')}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.2 text-[9px] font-bold">
                            <Check className="h-2.5 w-2.5" />
                            {txn.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                          <CreditCard className="h-3 w-3 text-gray-400" />
                          <span>{txn.payment_mode}</span>
                        </span>

                        <button
                          onClick={() => handleDownloadReceipt(txn.receipt_id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100 active:scale-95 transition"
                        >
                          <Download className="h-3 w-3 text-gray-500" />
                          <span>{receiptDownloaded === txn.receipt_id ? 'Downloaded!' : 'Receipt'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/* TAB 3: STAYS HISTORY */}
        {/* ---------------------------------------------------------- */}
        {activeTab === 'stays' && (
          <div className="space-y-3">
            {stays.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/60 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-gray-900">No Stays Found</h3>
                <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                  You haven't been assigned to a PG room yet. Once checked in by your property manager, your stay history and agreement details will appear here.
                </p>
                <div className="mt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#166534] transition"
                  >
                    <span>Browse PG Listings</span>
                  </Link>
                </div>
              </div>
            ) : (
              stays.map((stay: any, idx: number) => {
                const isActive = stay.status === 'active'
                return (
                  <div
                    key={stay.id || idx}
                    className={`rounded-3xl border bg-white p-4 sm:p-6 shadow-xs space-y-3 transition ${
                      isActive ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-gray-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? 'bg-[#DCFCE7] text-[#14532D]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isActive ? '● Currently Active Stay' : 'Completed Stay'}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400">
                        Ref: {stay.registration_number || `TN-STAY-${idx + 1}`}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-gray-900">{stay.property_name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                        <span>{stay.address || stay.city}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="rounded-xl bg-gray-50 p-2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Room & Bed</span>
                        <span className="font-bold text-gray-800 text-xs block mt-0.5">
                          {stay.room_number ? `${stay.room_number} • ${stay.bed_label || 'Bed A'}` : 'Pending Allotment'}
                        </span>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Check-In</span>
                        <span className="font-bold text-gray-800 text-xs block mt-0.5">
                          {stay.check_in_date || 'Pending'}
                        </span>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Monthly Rent</span>
                        <span className="font-bold text-gray-800 text-xs block mt-0.5">
                          {stay.monthly_rent_paise ? `₹${((stay.monthly_rent_paise) / 100).toLocaleString('en-IN')}/mo` : '₹0/mo'}
                        </span>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Escrow Deposit</span>
                        <span className="font-bold text-[#14532D] text-xs block mt-0.5">
                          {stay.deposit_held_paise ? `₹${((stay.deposit_held_paise) / 100).toLocaleString('en-IN')}` : '₹0'}
                        </span>
                      </div>
                    </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                    <Link
                      href="/portal?tab=ledger"
                      className="flex-1 sm:flex-none text-center rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#166534] transition"
                    >
                      Digital Passbook
                    </Link>
                    <Link
                      href="/portal?tab=hra"
                      className="flex-1 sm:flex-none text-center rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                    >
                      HRA Tax Kit
                    </Link>
                    {isActive && (
                      <Link
                        href="/portal?tab=gatepass"
                        className="flex-1 sm:flex-none text-center rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                      >
                        Gate Pass
                      </Link>
                    )}
                  </div>
                </div>
              )
            }))}
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/* TAB 4: KYC & DETAILED PERSONAL INFO */}
        {/* ---------------------------------------------------------- */}
        {activeTab === 'kyc' && (
          <div className="space-y-4">
            {/* Host Business & Payout Credentials Card for Owners */}
            {isOwner && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-gray-900">
                        Host & Organization Registration
                      </h3>
                      <p className="text-[10px] text-gray-500">Commercial PG & Property Management Identity</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Verified Host</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-2xl bg-white p-3 space-y-1 border border-emerald-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Organization / Host Business
                    </span>
                    <p className="font-bold text-gray-900 text-sm">
                      {currentUser?.organizations?.name && currentUser.organizations.name !== currentUser?.phone
                        ? currentUser.organizations.name
                        : (hostedProperties[0]?.name || 'PG-Setu Certified Host')}
                    </p>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      Org ID: {currentUser?.organization_id || 'Auto-Linked'}
                    </span>
                  </div>

                  <div className="rounded-2xl bg-white p-3 space-y-1 border border-emerald-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Direct Rent Payout UPI ID
                    </span>
                    <p className="font-mono font-bold text-[#14532D] text-sm truncate">
                      {hostedProperties[0]?.settings?.upi_id || currentUser?.organizations?.settings?.upi_id || 'Not Set — Click Below to Add'}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-semibold block">
                      0% Commission Direct Settlement
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => handleOpenPropertyModal(hostedProperties[0] || null)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-white px-3.5 py-2 text-xs font-bold text-[#14532D] hover:bg-emerald-50 transition cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Update UPI Payout & Tariffs</span>
                  </button>
                  <a
                    href="/dashboard/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#14532D] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#166534] transition shadow-xs"
                  >
                    <span>ERP Settings ↗</span>
                  </a>
                </div>
              </div>
            )}

            {/* Government KYC Card */}
            <div className="rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#14532D]">
                    <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-gray-900">
                      UIDAI DigiLocker KYC
                    </h3>
                    <p className="text-[10px] text-gray-400">Government Identity Clearance</p>
                  </div>
                </div>

                {isAadhaarVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Verified</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                    Pending
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-gray-50 p-3 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Aadhaar Number
                  </span>
                  <p className="font-mono text-sm font-black text-gray-800">
                    •••• •••• {aadhaarLast4}
                  </p>
                  <span className="text-[10px] text-gray-500 block">
                    256-bit AES encrypted DigiLocker clearance
                  </span>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3 space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Police Verification
                  </span>
                  {profileData?.police_verified ? (
                    <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Police Clearance Submitted</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-700 font-bold text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Pending Submission</span>
                    </div>
                  )}
                  <span className="text-[10px] text-gray-500 block">
                    {profileData?.police_verified ? 'Approved by Resident Police Liaison' : 'Submit ID for police verification clearance'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setIsAadhaarModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>{isAadhaarVerified ? 'Re-verify Aadhaar' : 'Verify Aadhaar Now'}</span>
                </button>
              </div>
            </div>

            {/* Personal & Emergency Contact Card */}
            <div className="rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-gray-900">
                    Personal & Safety Information
                  </h3>
                  <p className="text-[10px] text-gray-400">Emergency contacts & employer details</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#14532D] hover:bg-emerald-100 transition"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Full Name</span>
                  <p className="font-bold text-gray-900 mt-0.5">{currentUser.full_name || profileData?.full_name || 'PG-Setu Member'}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Mobile (Verified)</span>
                  <p className="font-bold text-gray-900 mt-0.5">+91 {currentUser.phone || profileData?.mobile || 'Not set'}</p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Email</span>
                  <p className="font-bold text-gray-900 mt-0.5 truncate">
                    {(() => {
                      const em = currentUser.email || profileData?.email || ''
                      if (!em || em.includes('@owner.pgsetu.') || em.includes('@user.pgsetu.') || em.includes('@resident.pgsetu.') || em.includes('@pgsetu.online') || em.includes('@pgsetu.local')) {
                        return 'Not provided'
                      }
                      return em
                    })()}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">DOB & Age</span>
                  <p className="font-bold text-gray-900 mt-0.5 capitalize">
                    {profileData?.dob ? new Date(profileData.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'} {profileData?.age ? `• ${profileData.age} Yrs` : ''}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Profession / College</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {profileData?.profession || 'Not set'}
                    {profileData?.college_or_company ? ` (${profileData.college_or_company})` : ''}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5">
                  <span className="text-gray-400 text-[10px] font-bold block">Emergency Contact</span>
                  {profileData?.emergency_name ? (
                    <>
                      <p className="font-bold text-gray-900 mt-0.5">
                        {profileData.emergency_name} {profileData.emergency_relation ? `(${profileData.emergency_relation})` : ''}
                      </p>
                      {profileData.emergency_phone && (
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                          +91 {profileData.emergency_phone}
                        </p>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-bold text-[#16A34A] hover:underline mt-0.5 text-left block"
                    >
                      + Add Emergency Contact
                    </button>
                  )}
                </div>

                <div className="rounded-xl bg-gray-50 p-2.5 sm:col-span-2">
                  <span className="text-gray-400 text-[10px] font-bold block">Permanent Address</span>
                  {profileData?.permanent_address ? (
                    <p className="font-bold text-gray-900 mt-0.5">
                      {profileData.permanent_address}{profileData.permanent_city ? `, ${profileData.permanent_city}` : ''}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs font-bold text-[#16A34A] hover:underline mt-0.5 text-left block"
                    >
                      + Add Permanent Address
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ---------------------------------------------------------- */}
      {/* 5. MODAL 1: EDIT DETAILS (MOBILE BOTTOM-SHEET DRAWER) */}
      {/* ---------------------------------------------------------- */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto overscroll-contain">
            {/* Mobile Sheet Pull Bar */}
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

            <button
              onClick={() => setIsEditing(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-black text-gray-900">Edit Profile & Safety Info</h3>
            <p className="text-xs text-gray-500">Updates sync to Supabase database & verified tenant registry</p>

            {saveSuccessMsg && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={editDob}
                    onChange={(e) => {
                      setEditDob(e.target.value)
                      if (e.target.value) {
                        const birthDate = new Date(e.target.value)
                        const today = new Date()
                        let calculatedAge = today.getFullYear() - birthDate.getFullYear()
                        const m = today.getMonth() - birthDate.getMonth()
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                          calculatedAge--
                        }
                        if (calculatedAge > 0 && calculatedAge < 120) {
                          setEditAge(String(calculatedAge))
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A] bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Gender</label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A] bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Age</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={16}
                  max={100}
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Profession</label>
                  <input
                    type="text"
                    value={editProfession}
                    onChange={(e) => setEditProfession(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Company / College</label>
                  <input
                    type="text"
                    value={editCollegeCompany}
                    onChange={(e) => setEditCollegeCompany(e.target.value)}
                    placeholder="e.g. Infosys / Amity"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="rounded-2xl bg-amber-50/70 p-3 border border-amber-200/80 space-y-2">
                <span className="text-[11px] font-bold text-amber-900 uppercase block">
                  Emergency Contact (Safety Record)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Contact Name</label>
                    <input
                      type="text"
                      value={editEmergencyName}
                      onChange={(e) => setEditEmergencyName(e.target.value)}
                      placeholder="e.g. Parent Name"
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Relationship</label>
                    <select
                      value={editEmergencyRelation}
                      onChange={(e) => setEditEmergencyRelation(e.target.value)}
                      className="w-full px-2 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Friend">Friend</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Emergency Phone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={editEmergencyPhone}
                    onChange={(e) => setEditEmergencyPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile"
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Permanent Home Address</label>
                <input
                  type="text"
                  value={editPermanentAddress}
                  onChange={(e) => setEditPermanentAddress(e.target.value)}
                  placeholder="Street / Apartment / House No."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Permanent City & State</label>
                <input
                  type="text"
                  value={editPermanentCity}
                  onChange={(e) => setEditPermanentCity(e.target.value)}
                  placeholder="e.g. Kanpur, Uttar Pradesh"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold text-white bg-[#14532D] hover:bg-[#166534] rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save & Sync'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* 6. MODAL 2: AADHAAR VERIFICATION (BOTTOM SHEET) */}
      {/* ---------------------------------------------------------- */}
      {isAadhaarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

            <button
              onClick={() => setIsAadhaarModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCFCE7] text-[#14532D]">
                <ShieldCheck className="h-5 w-5 text-[#16A34A]" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">UIDAI DigiLocker KYC</h3>
                <p className="text-xs text-gray-500">Instant government identity verification</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  12-Digit Aadhaar Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={aadhaarInput}
                  onChange={(e) => setAadhaarInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="XXXX XXXX XXXX"
                  className="w-full px-3.5 py-2.5 font-mono tracking-widest text-sm rounded-xl border border-gray-300 focus:border-[#16A34A] outline-none text-center"
                />
              </div>

              {aadhaarInput.length === 12 && !aadhaarOtpSent && (
                <button
                  type="button"
                  onClick={() => setAadhaarOtpSent(true)}
                  className="w-full py-3 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition active:scale-95"
                >
                  Send UIDAI OTP to Registered Mobile
                </button>
              )}

              {aadhaarOtpSent && (
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800">
                    OTP sent to UIDAI registered number. Enter demo code <strong>123456</strong>.
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2.5 text-center tracking-widest font-mono text-sm rounded-xl border border-gray-300 outline-none"
                  />
                  <button
                    type="button"
                    disabled={verifyingAadhaar || aadhaarOtp.length < 6}
                    onClick={handleConfirmAadhaar}
                    className="w-full py-3 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition disabled:opacity-50"
                  >
                    {verifyingAadhaar ? 'Verifying with UIDAI...' : 'Confirm Verification'}
                  </button>
                </div>
              )}

              {aadhaarSuccess && (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Aadhaar Successfully Verified & Stored!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* 7. MODAL 3: SHOW QR CODE MODAL */}
      {/* ---------------------------------------------------------- */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#14532D] mb-3">
              <QrCode className="h-6 w-6 text-[#16A34A]" />
            </div>
            <h3 className="text-base font-black text-gray-900">Gate & Identity QR Code</h3>
            <p className="text-xs text-gray-500 mt-0.5">Show this to PG Warden or biometric gate reader</p>

            {/* Simulated Vector QR Graphic */}
            <div className="my-4 p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col items-center justify-center">
              <div className="h-40 w-40 bg-white p-3 rounded-xl shadow-xs border border-gray-200 flex flex-col items-center justify-center gap-2">
                <div className="grid grid-cols-6 gap-1 w-full h-full p-2">
                  {[...Array(36)].map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i % 2 === 0 && i % 3 !== 0) || i === 0 || i === 5 || i === 30 || i === 35
                          ? 'bg-gray-900'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="font-mono text-xs font-black text-[#14532D] mt-2 block">
                {uniqueId}
              </span>
              <span className="text-[10px] text-gray-400">Scan for instant security gate clearance</span>
            </div>

            <button
              onClick={handleShareIdCard}
              className="w-full py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition active:scale-95"
            >
              Share Digital Pass
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* 8. MODAL 4: QUICK UPI PAY BOTTOM SHEET */}
      {/* ---------------------------------------------------------- */}
      {isUpiPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

            <button
              onClick={() => setIsUpiPayModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Instant UPI Rent Settlement</h3>
                <p className="text-xs text-gray-500">Zero surcharge UPI auto-reconciliation</p>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200 text-center my-3">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Current Monthly Rent Due</span>
              <span className="text-2xl font-black text-gray-900 block mt-0.5">
                ₹{((activeStay?.monthly_rent_paise || 0) / 100).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                For {activeStay?.property_name || 'PG-Setu Member'} ({activeStay?.room_number || 'Room Pending'})
              </span>
            </div>

            <div className="space-y-2">
              <a
                href={`upi://pay?pa=pgsetu@icici&pn=PGSetu%20Residency&am=${(activeStay?.monthly_rent_paise || 0) / 100}&cu=INR&tn=Rent%20Settlement`}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#14532D] to-[#16A34A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-95 transition"
              >
                <Smartphone className="h-4 w-4" />
                <span>Launch UPI App (GPay / PhonePe / Paytm)</span>
              </a>

              <button
                onClick={() => {
                  handleCopyId('pgsetu@icici')
                  alert('UPI ID copied: pgsetu@icici')
                }}
                className="w-full py-2.5 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Copy Host UPI ID: pgsetu@icici
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* 9. MODAL 5: INSTANT GUEST GATE PASS */}
      {/* ---------------------------------------------------------- */}
      {isGatePassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

            <button
              onClick={() => {
                setIsGatePassModalOpen(false)
                setGeneratedPassCode(null)
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Instant Guest Gate Pass</h3>
                <p className="text-xs text-gray-500">Issue visitor clearance for your room</p>
              </div>
            </div>

            {generatedPassCode ? (
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-center space-y-2 my-3">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                  Gate Pass Code (Valid for 6 Hours)
                </span>
                <span className="font-mono text-3xl font-black text-[#14532D] tracking-widest block">
                  #{generatedPassCode}
                </span>
                <p className="text-xs text-emerald-700">
                  Visitor <strong>{visitorName || 'Guest'}</strong> can show this code at the security gate for instant access to {activeStay?.room_number || 'your room'}.
                </p>
                <button
                  onClick={() => {
                    handleCopyId(generatedPassCode)
                    alert(`Gate Pass #${generatedPassCode} copied to clipboard!`)
                  }}
                  className="mt-2 w-full py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition"
                >
                  Copy & Send on WhatsApp
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateGatePass} className="space-y-3 mt-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Visitor Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Purpose of Visit
                  </label>
                  <select
                    value={visitorPurpose}
                    onChange={(e) => setVisitorPurpose(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-300 outline-none focus:border-[#16A34A] bg-white"
                  >
                    <option value="Friend Visiting">Friend Visiting</option>
                    <option value="Family / Parent">Family / Parent</option>
                    <option value="Study / Project Work">Study / Project Work</option>
                    <option value="Courier / Delivery">Courier / Delivery</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition active:scale-95"
                >
                  Generate 6-Digit Gate Pass
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* 10. MODAL 6: EDIT HOSTED PROPERTY DETAILS & TERMS          */}
      {/* ---------------------------------------------------------- */}
      {isPropertyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-6 shadow-2xl">
            <div className="sm:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

            <button
              onClick={() => setIsPropertyModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#14532D]">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900">
                  {editingProperty?.id ? 'Edit Property & Listing Terms' : 'List New PG / Hostel Property'}
                </h3>
                <p className="text-xs text-gray-500">
                  {editingProperty?.id
                    ? 'Updates sync instantly to Supabase and marketplace search'
                    : 'Set up your PG details, monthly rent, and rules to start taking bookings'}
                </p>
              </div>
            </div>

            {propSaveSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-[#14532D] border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{propSaveSuccess}</span>
              </div>
            )}

            {propSaveError && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{propSaveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProperty} className="space-y-4">
              {/* Basic Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Property Information
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={propName}
                    onChange={(e) => setPropName(e.target.value)}
                    placeholder="e.g. PG-SETU Executive Co-Living"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Manager Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={propPhone}
                      onChange={(e) => setPropPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={propEmail}
                      onChange={(e) => setPropEmail(e.target.value)}
                      placeholder="e.g. contact@pgsetu.com"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={propAddress}
                    onChange={(e) => setPropAddress(e.target.value)}
                    placeholder="e.g. Sector 62, Block B, Near Metro Station"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={propCity}
                      onChange={(e) => setPropCity(e.target.value)}
                      placeholder="Noida"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={propState}
                      onChange={(e) => setPropState(e.target.value)}
                      placeholder="Uttar Pradesh"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      value={propPincode}
                      onChange={(e) => setPropPincode(e.target.value)}
                      placeholder="201309"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Listing Description
                  </label>
                  <textarea
                    rows={2}
                    value={propDescription}
                    onChange={(e) => setPropDescription(e.target.value)}
                    placeholder="Brief highlights for prospective residents..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                </div>
              </div>

              {/* Property Photos & Gallery (Minimum 5 Photos) */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-[#14532D]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Property Photos & Gallery
                    </h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                      propPhotos.length >= 5
                        ? 'bg-emerald-100 text-[#14532D] border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {propPhotos.length} / 5 Photos {propPhotos.length >= 5 ? '✓ Verified (Recommended)' : '(Min 5 Recommended)'}
                  </span>
                </div>

                <p className="text-xs text-gray-500">
                  Upload photos of rooms, washrooms, dining, and exterior from your device. Listings with at least 5 photos receive 3x more resident bookings.
                </p>

                {/* Upload Action Area */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label className="sm:col-span-2 relative flex flex-col items-center justify-center border-2 border-dashed border-emerald-400 hover:border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl p-4 cursor-pointer transition text-center group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleLocalPhotoUpload}
                      className="sr-only"
                    />
                    <UploadCloud className="h-7 w-7 text-[#14532D] mb-1 group-hover:scale-110 transition" />
                    <span className="text-xs font-black text-[#14532D]">
                      {isUploadingPhotos ? 'Compressing & Adding Photos...' : 'Click to Upload Local Photos'}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      Select multiple JPG, PNG, WebP from phone/PC (Auto-optimized)
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAddSamplePhotos}
                    className="flex flex-col items-center justify-center border border-emerald-200 bg-white hover:bg-emerald-50/60 rounded-2xl p-4 text-center transition cursor-pointer"
                  >
                    <Sparkles className="h-5 w-5 text-amber-500 mb-1" />
                    <span className="text-xs font-bold text-gray-800">
                      + Add Sample Photos
                    </span>
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      Auto-fill 5 verified sample PG photos
                    </span>
                  </button>
                </div>

                {/* Uploaded Photos Grid */}
                {propPhotos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Click image to set as Cover Photo</span>
                      <button
                        type="button"
                        onClick={() => setPropPhotos([])}
                        className="text-red-600 hover:underline text-[10px] font-bold cursor-pointer"
                      >
                        Clear All Photos
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                      {propPhotos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group shadow-2xs"
                        >
                          <img
                            src={photoUrl}
                            alt={`Photo ${pIdx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Cover badge / Set as cover */}
                          {pIdx === 0 ? (
                            <span className="absolute top-1 left-1 rounded-md bg-[#14532D] text-white px-1.5 py-0.5 text-[9px] font-black shadow-xs">
                              Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMakeCoverPhoto(pIdx)}
                              className="absolute top-1 left-1 rounded-md bg-black/70 hover:bg-black text-white px-1.5 py-0.5 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                            >
                              Make Cover
                            </button>
                          )}

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(pIdx)}
                            className="absolute top-1 right-1 rounded-full bg-red-600 hover:bg-red-700 text-white p-1 shadow-sm transition cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Terms */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Tariffs & Terms
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Starting Rent (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={propRent}
                      onChange={(e) => setPropRent(e.target.value)}
                      placeholder="7500"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Notice (Days)
                    </label>
                    <input
                      type="number"
                      value={propNoticePeriod}
                      onChange={(e) => setPropNoticePeriod(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Lock-In (Mo)
                    </label>
                    <input
                      type="number"
                      value={propLockIn}
                      onChange={(e) => setPropLockIn(e.target.value)}
                      placeholder="3"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Gate Closes
                    </label>
                    <input
                      type="text"
                      value={propGateClosing}
                      onChange={(e) => setPropGateClosing(e.target.value)}
                      placeholder="11:00 PM"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                    Direct UPI ID for Auto Rent Collection
                  </label>
                  <input
                    type="text"
                    value={propUpiId}
                    onChange={(e) => setPropUpiId(e.target.value)}
                    placeholder="e.g. vikram@okhdfcbank or 9876543210@upi"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 outline-none focus:border-[#16A34A]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Residents scanning the QR on profile or invoice will transfer directly to this UPI handle.
                  </p>
                </div>
              </div>

              {/* Amenities Selector */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-[11px] font-bold text-gray-700 uppercase">
                  Included Amenities (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_AMENITIES.map((amenity) => {
                    const selected = propAmenities.includes(amenity)
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                          selected
                            ? 'bg-[#14532D] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        <span>{amenity}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* House Rules Selector */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="block text-[11px] font-bold text-gray-700 uppercase">
                  House Rules (Click to toggle)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_RULES.map((rule) => {
                    const selected = propRules.includes(rule)
                    return (
                      <button
                        type="button"
                        key={rule}
                        onClick={() => toggleRule(rule)}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                          selected
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-900 border border-amber-200/60 hover:bg-amber-100'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3" />}
                        <span>{rule}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPropertyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProperty}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14532D] text-white text-xs font-bold hover:bg-[#166534] transition active:scale-95 disabled:opacity-50"
                >
                  {savingProperty ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Live to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{editingProperty?.id ? 'Save Property Changes' : 'Create & Publish Property'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. MODAL 7: CONFIRM DELETE PROPERTY */}
      {deletingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Delete Listed Property?
                </h3>
                <p className="text-xs text-gray-500">
                  Permanent removal from PG-SETU marketplace
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
              <p>
                Are you sure you want to delete <span className="font-black text-gray-900">{deletingProperty.name || 'this property'}</span>?
              </p>
              <p className="text-gray-500 text-[11px] leading-relaxed">
                • Listing and public search URL will be unlinked.
                <br />• Associated rooms and beds will be unlinked.
                <br />• This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingProperty}
                onClick={() => {
                  setDeletingProperty(null)
                  setDeleteError('')
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProperty}
                onClick={handleConfirmDeleteProperty}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isDeletingProperty ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting Property...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Yes, Delete Property</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. MODAL 8: 10-STEP LIST PROPERTY WIZARD (Wizard Modal shown in screenshot) */}
      <ListPropertyModal
        isOpen={isListPropertyWizardOpen}
        onClose={() => setIsListPropertyWizardOpen(false)}
        onListingCreated={handleWizardListingCreated}
      />

      {/* 13. MODAL 9: LOCKED PROPERTY LISTING ALERT MODAL */}
      {isListingLockedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setIsListingLockedModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3 shadow-inner">
                <Lock className="h-7 w-7 stroke-[2.2]" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Property Listing Locked</h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                As per PGSetu security policy, PG Owners can only list properties on the website after our Verification Team verifies personal details and finishes official onboarding.
              </p>
              <div className="mt-5 w-full space-y-2">
                <a
                  href={`https://wa.me/919453522757?text=${encodeURIComponent(
                    `Hello Operations Team, I want to list my PG property on PGSetu. Please finish my onboarding and unlock listing for Mobile: +91 ${currentUser?.phone || ''}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#14532D] to-[#16A34A] py-3 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Request Unlocking via WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsListingLockedModalOpen(false)}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legal & Policy Links Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 pb-16">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-gray-600">
          <Link href="/terms" target="_blank" className="hover:text-[#14532D] hover:underline cursor-pointer">Terms &amp; Conditions</Link>
          <span>·</span>
          <Link href="/privacy-policy" target="_blank" className="hover:text-[#14532D] hover:underline cursor-pointer">Privacy Policy</Link>
          <span>·</span>
          <Link href="/safety" target="_blank" className="hover:text-[#14532D] hover:underline cursor-pointer">Safety Guidelines</Link>
          <span>·</span>
          <Link href="/refund-policy" target="_blank" className="hover:text-[#14532D] hover:underline cursor-pointer">Refund Policy</Link>
        </div>
        <p className="mt-2 text-[11px] text-gray-400">© 2026 PGSetu PropTech Technologies Pvt. Ltd.</p>
      </div>

      {/* Share Toast */}
      {sharedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-gray-900 text-white px-4 py-2.5 text-xs font-bold shadow-xl flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>Tenant Pass copied to clipboard!</span>
        </div>
      )}
    </div>
  )
}

export default function MyProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F7FAF7]">
          <Loader2 className="h-8 w-8 animate-spin text-[#16A34A]" />
        </div>
      }
    >
      <MyProfileContent />
    </Suspense>
  )
}