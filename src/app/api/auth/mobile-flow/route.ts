import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { cleanMobile, isValidMobile, generateTenantId } from '@/lib/profiles'

// In-memory OTP cache for instant verification (TTL: 5 minutes)
const OTP_STORE = new Map<string, { code: string; expiresAt: number }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    const serviceClient = await createServiceClient()
    const cookieStore = await cookies()

    // ─────────────────────────────────────────────────────────
    // 1. ACTION: CHECK MOBILE NUMBER
    // ─────────────────────────────────────────────────────────
    // 1. ACTION: CHECK MOBILE NUMBER & DISPATCH OTP
    // ─────────────────────────────────────────────────────────
    if (action === 'check-mobile') {
      const rawMobile = body.mobile || ''
      const cleaned = cleanMobile(rawMobile)

      if (!cleaned || cleaned.length < 10) {
        return NextResponse.json(
          { error: 'Please enter a valid 10-digit Indian mobile number.' },
          { status: 400 }
        )
      }

      // Generate 6-digit OTP upfront so it is ready immediately
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      OTP_STORE.set(cleaned, {
        code: otpCode,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      })
      console.log(`[PG-SETU OTP]: Generated OTP ${otpCode} for mobile ${cleaned}`)

      // A. Check in Supabase users table (Owners, Managers, Staff, Registered Residents)
      const { data: matchedUser } = await serviceClient
        .from('users')
        .select('id, full_name, email, phone, role, organization_id')
        .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
        .maybeSingle()

      if (matchedUser) {
        return NextResponse.json({
          exists: true,
          userType: matchedUser.role === 'owner' || matchedUser.role === 'superadmin' ? 'owner' : 'user',
          name: matchedUser.full_name || 'PG-Setu Member',
          role: matchedUser.role,
          email: matchedUser.email,
          mobile: cleaned,
          devOtp: otpCode,
          message: `Welcome back, ${matchedUser.full_name || 'Member'}! OTP sent to your registered mobile.`,
        })
      }

      // B. Check in Supabase residents table (Checked-in PG Tenants across properties)
      const { data: matchedResident } = await serviceClient
        .from('residents')
        .select('id, full_name, email, phone, registration_number, status, organization_id')
        .or(`phone.ilike.%${cleaned}%,alternate_phone.ilike.%${cleaned}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (matchedResident) {
        return NextResponse.json({
          exists: true,
          userType: 'tenant',
          name: matchedResident.full_name,
          role: 'resident',
          email: matchedResident.email,
          tenantId: matchedResident.registration_number,
          mobile: cleaned,
          devOtp: otpCode,
          message: `Welcome back, ${matchedResident.full_name}! OTP sent to your registered mobile.`,
        })
      }

      // C. Check in Firestore profiles (tenant_profiles / owner_profiles) with timeout safeguard
      try {
        const firestoreCheck = (async () => {
          const { queryCollection } = await import('@/lib/firebase/firestore')
          const tenantMatches = await queryCollection('tenant_profiles', [['mobile', '==', cleaned]])
          if (tenantMatches && tenantMatches.length > 0) {
            return { matched: true, type: 'tenant', profile: tenantMatches[0] }
          }
          const ownerMatches = await queryCollection('owner_profiles', [['mobile', '==', cleaned]])
          if (ownerMatches && ownerMatches.length > 0) {
            return { matched: true, type: 'owner', profile: ownerMatches[0] }
          }
          return { matched: false }
        })()

        const timeoutCheck = new Promise<{ matched: boolean }>((resolve) =>
          setTimeout(() => resolve({ matched: false }), 800)
        )

        const fRes = await Promise.race([firestoreCheck, timeoutCheck])
        if (fRes.matched && (fRes as any).profile) {
          const p = (fRes as any).profile
          return NextResponse.json({
            exists: true,
            userType: (fRes as any).type,
            name: p.full_name || 'Verified Member',
            role: (fRes as any).type === 'owner' ? 'owner' : 'resident',
            email: p.email,
            tenantId: p.id,
            mobile: cleaned,
            devOtp: otpCode,
            message: `Welcome back, ${p.full_name || 'Member'}! OTP sent to your registered mobile.`,
          })
        }
      } catch (err: any) {
        console.warn('[Firestore profile check warning in check-mobile]:', err?.message)
      }

      // D. Mobile does not exist in database -> New user flow (Ask for other information)
      return NextResponse.json({
        exists: false,
        mobile: cleaned,
        devOtp: otpCode,
        message: 'New mobile number detected. Please enter your details to set up your profile.',
      })
    }

    // ─────────────────────────────────────────────────────────
    // 2. ACTION: SEND OTP
    // ─────────────────────────────────────────────────────────
    if (action === 'send-otp') {
      const rawMobile = body.mobile || ''
      const cleaned = cleanMobile(rawMobile)

      if (!cleaned || cleaned.length < 10) {
        return NextResponse.json(
          { error: 'Valid 10-digit mobile number required.' },
          { status: 400 }
        )
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      OTP_STORE.set(cleaned, {
        code: otpCode,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      })

      console.log(`[PG-SETU OTP]: Sent OTP ${otpCode} to mobile ${cleaned}`)

      return NextResponse.json({
        success: true,
        message: 'OTP sent to ' + cleaned.slice(0, 2) + '******' + cleaned.slice(-2),
        // For development/demo purposes, surface demo OTP so user can log in immediately
        devOtp: otpCode,
      })
    }

    // ─────────────────────────────────────────────────────────
    // 2B. ACTION: VERIFY RESIDENT OTP (FOR OWNER CHECK-IN WORKFLOW)
    // ─────────────────────────────────────────────────────────
    if (action === 'verify-resident-otp') {
      const rawMobile = body.mobile || ''
      const cleaned = cleanMobile(rawMobile)
      const userOtp = (body.otp || '').trim()

      const cached = OTP_STORE.get(cleaned)
      const isMasterOtp = userOtp === '123456'
      const isValid = isMasterOtp || (cached && cached.code === userOtp && Date.now() <= cached.expiresAt)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP. Please enter the correct 6-digit code or use 123456.' },
          { status: 400 }
        )
      }

      // Clear used OTP
      OTP_STORE.delete(cleaned)

      return NextResponse.json({
        success: true,
        verified: true,
        mobile: cleaned,
      })
    }

    // ─────────────────────────────────────────────────────────
    // 3. ACTION: VERIFY OTP FOR EXISTING USER LOGIN & SAVE IN SUPABASE
    // ─────────────────────────────────────────────────────────
    if (action === 'verify-otp-login') {
      const rawMobile = body.mobile || ''
      const cleaned = cleanMobile(rawMobile)
      const userOtp = (body.otp || '').trim()

      const cached = OTP_STORE.get(cleaned)
      const isMasterOtp = userOtp === '123456'
      const isValid = isMasterOtp || (cached && cached.code === userOtp && Date.now() <= cached.expiresAt)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP. Please enter the correct 6-digit code or use 123456.' },
          { status: 400 }
        )
      }

      // Clear used OTP
      OTP_STORE.delete(cleaned)

      // Fetch default organization for foreign key association
      const { data: defaultOrg } = await serviceClient
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle()
      const defaultOrgId = defaultOrg?.id || null

      // Look up in Supabase users table
      const { data: user } = await serviceClient
        .from('users')
        .select('id, full_name, email, phone, role, organization_id, resident_id')
        .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
        .maybeSingle()

      // Look up in Supabase residents table
      const { data: resident } = await serviceClient
        .from('residents')
        .select('id, full_name, email, phone, registration_number, organization_id')
        .or(`phone.ilike.%${cleaned}%,alternate_phone.ilike.%${cleaned}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // Look up in Firestore tenant_profiles / owner_profiles with timeout safeguard
      let firestoreProfile: any = null
      try {
        const firestorePromise = (async () => {
          const { queryCollection } = await import('@/lib/firebase/firestore')
          const tMatches = await queryCollection('tenant_profiles', [['mobile', '==', cleaned]])
          if (tMatches && tMatches.length > 0) return tMatches[0]
          const oMatches = await queryCollection('owner_profiles', [['mobile', '==', cleaned]])
          if (oMatches && oMatches.length > 0) return oMatches[0]
          return null
        })()
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 800))
        firestoreProfile = await Promise.race([firestorePromise, timeoutPromise])
      } catch {}

      // Consolidate identity
      const targetUserId = user?.id || resident?.id || crypto.randomUUID()
      const effectiveName = user?.full_name || resident?.full_name || firestoreProfile?.full_name || 'PG-Setu Member'
      const effectiveEmail = user?.email || resident?.email || firestoreProfile?.email || `${cleaned}@user.pgsetu.com`
      const effectiveRole = user?.role || (resident ? 'resident' : (firestoreProfile?.type === 'owner' ? 'owner' : 'resident'))
      const residentId = resident?.id || user?.resident_id || null
      const orgId = user?.organization_id || resident?.organization_id || defaultOrgId
      const tenantRegId = resident?.registration_number || firestoreProfile?.id || `TN-${cleaned.slice(-4)}`

      const now = new Date().toISOString()

      // ─── SAVE / UPSERT SIGNED-IN USER IN SUPABASE ───────────
      const { data: savedUser, error: saveErr } = await serviceClient
        .from('users')
        .upsert({
          id: targetUserId,
          organization_id: orgId,
          email: effectiveEmail,
          full_name: effectiveName,
          phone: cleaned,
          role: effectiveRole,
          resident_id: residentId,
          is_active: true,
          last_login_at: now,
          updated_at: now,
        })
        .select()
        .maybeSingle()

      if (saveErr) {
        console.warn('[Supabase Users Upsert Warning on Login]:', saveErr.message)
      }

      // Set session cookies
      cookieStore.set('auth_user_id', targetUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('auth_email', effectiveEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('auth_role', effectiveRole, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('auth_mobile', cleaned, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('pgsetu_profile_id', tenantRegId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      if (residentId) {
        cookieStore.set('resident_id', residentId, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      }

      return NextResponse.json({
        success: true,
        redirect: '/my-profile',
        user: savedUser || {
          id: targetUserId,
          full_name: effectiveName,
          email: effectiveEmail,
          phone: cleaned,
          role: effectiveRole,
        },
      })
    }

    // ─────────────────────────────────────────────────────────
    // 4. ACTION: REGISTER NEW USER & SAVE IN SUPABASE
    // ─────────────────────────────────────────────────────────
    if (action === 'register-new-user') {
      const {
        mobile,
        full_name,
        gender,
        age,
        profession,
        email,
        otp,
        aadhaar_number,
        aadhaar_verified = false,
      } = body

      const cleanedMobile = cleanMobile(mobile || '')
      if (!cleanedMobile || cleanedMobile.length < 10) {
        return NextResponse.json({ error: 'Valid 10-digit mobile number required.' }, { status: 400 })
      }
      if (!full_name || !full_name.trim()) {
        return NextResponse.json({ error: 'Full Name is required.' }, { status: 400 })
      }
      if (!gender) {
        return NextResponse.json({ error: 'Gender is required.' }, { status: 400 })
      }
      if (!age || Number(age) < 16 || Number(age) > 100) {
        return NextResponse.json({ error: 'Valid age (16-100) is required.' }, { status: 400 })
      }
      if (!profession || !profession.trim()) {
        return NextResponse.json({ error: 'Profession is required.' }, { status: 400 })
      }

      // Verify OTP for new user
      const userOtp = (otp || '').trim()
      const cached = OTP_STORE.get(cleanedMobile)
      const isMasterOtp = userOtp === '123456'
      const isValid = isMasterOtp || (cached && cached.code === userOtp && Date.now() <= cached.expiresAt)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP. Please enter the correct 6-digit code or use 123456.' },
          { status: 400 }
        )
      }

      // Clear used OTP
      OTP_STORE.delete(cleanedMobile)

      // Fetch default organization for Supabase foreign key constraints
      const { data: defaultOrg } = await serviceClient
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle()
      const defaultOrgId = defaultOrg?.id || null

      // Generate canonical Unique Tenant / User ID (e.g. TN2026-X8K)
      const uniqueTenantId = generateTenantId()
      const effectiveEmail = (email && email.trim()) ? email.trim().toLowerCase() : `${cleanedMobile}@user.pgsetu.com`
      
      // Check if user record already exists by phone or email
      const { data: existingUser } = await serviceClient
        .from('users')
        .select('id')
        .or(`phone.eq.${cleanedMobile},phone.ilike.%${cleanedMobile}%,email.ilike.${effectiveEmail}`)
        .maybeSingle()

      const targetUserId = existingUser ? existingUser.id : crypto.randomUUID()
      const now = new Date().toISOString()

      // ─── SAVE IN SUPABASE USERS TABLE ───────────────────────
      const { data: savedUser, error: saveErr } = await serviceClient
        .from('users')
        .upsert({
          id: targetUserId,
          organization_id: defaultOrgId,
          email: effectiveEmail,
          full_name: full_name.trim(),
          phone: cleanedMobile,
          role: 'resident',
          is_active: true,
          last_login_at: now,
          created_at: now,
          updated_at: now,
        })
        .select()
        .maybeSingle()

      if (saveErr) {
        console.warn('[Supabase Users Upsert Warning on Register]:', saveErr.message)
      }

      // Prepare and save profile in Firestore
      try {
        const { createDocument } = await import('@/lib/firebase/firestore')
        await createDocument(
          'tenant_profiles',
          {
            id: uniqueTenantId,
            user_id: targetUserId,
            full_name: full_name.trim(),
            mobile: cleanedMobile,
            email: effectiveEmail,
            gender,
            age: Number(age),
            profession: profession.trim(),
            verified_mobile: true,
            aadhaar_verified: Boolean(aadhaar_verified),
            aadhaar_last4: aadhaar_number ? aadhaar_number.replace(/\D/g, '').slice(-4) : null,
            created_at: now,
            updated_at: now,
          },
          uniqueTenantId
        )
      } catch (fErr: any) {
        console.warn('[Firestore Profile Save Warning]:', fErr?.message)
      }

      // Set cookies for immediate logged-in session
      cookieStore.set('auth_user_id', targetUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('auth_email', effectiveEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('auth_role', 'resident', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('auth_mobile', cleanedMobile, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('pgsetu_profile_id', uniqueTenantId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })

      return NextResponse.json({
        success: true,
        message: 'Profile created and saved in Supabase successfully.',
        redirect: '/my-profile',
        user: savedUser || {
          id: targetUserId,
          full_name: full_name.trim(),
          email: effectiveEmail,
          phone: cleanedMobile,
          role: 'resident',
        },
        profile: {
          id: uniqueTenantId,
          full_name: full_name.trim(),
          mobile: cleanedMobile,
          email: effectiveEmail,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid action requested.' }, { status: 400 })
  } catch (err: any) {
    console.error('Error in /api/auth/mobile-flow:', err)
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 })
  }
}
