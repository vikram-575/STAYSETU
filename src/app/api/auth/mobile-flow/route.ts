import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { cleanMobile, isValidMobile, generateTenantId } from '@/lib/profiles'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
      const requestedRole = body.role === 'owner' ? 'owner' : 'tenant'

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
      console.log(`[PG-SETU OTP]: Generated OTP ${otpCode} for mobile ${cleaned} (Role: ${requestedRole})`)

      if (requestedRole === 'owner') {
        // ── PG OWNER EXISTENCE VERIFICATION ──
        // 1. Check in Supabase users table for PG Owners / Managers / Staff / Accountants
        let { data: matchedOwnerUser } = await serviceClient
          .from('users')
          .select('id, full_name, email, phone, role, organization_id')
          .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
          .in('role', ['owner', 'manager', 'staff', 'accountant'])
          .limit(1)
          .maybeSingle()

        // 2. Check in organizations table by phone
        let { data: matchedOrg } = await serviceClient
          .from('organizations')
          .select('id, name, email, phone, owner_user_id')
          .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
          .limit(1)
          .maybeSingle()

        // Bidirectional resolution: if user found, fetch org; if org found, fetch user
        if (matchedOwnerUser?.organization_id && !matchedOrg) {
          const { data: orgById } = await serviceClient
            .from('organizations')
            .select('id, name, email, phone, owner_user_id')
            .eq('id', matchedOwnerUser.organization_id)
            .maybeSingle()
          if (orgById) matchedOrg = orgById
        } else if (matchedOrg?.owner_user_id && !matchedOwnerUser) {
          const { data: userById } = await serviceClient
            .from('users')
            .select('id, full_name, email, phone, role, organization_id')
            .eq('id', matchedOrg.owner_user_id)
            .maybeSingle()
          if (userById) matchedOwnerUser = userById
        }

        if (matchedOwnerUser || matchedOrg) {
          return NextResponse.json({
            exists: true,
            userType: 'owner',
            role: matchedOwnerUser?.role || 'owner',
            name: matchedOwnerUser?.full_name || matchedOrg?.name || 'PG Owner',
            email: matchedOwnerUser?.email || matchedOrg?.email || '',
            organizationId: matchedOwnerUser?.organization_id || matchedOrg?.id,
            mobile: cleaned,
            devOtp: otpCode,
            message: `Welcome back, ${matchedOwnerUser?.full_name || matchedOrg?.name || 'Owner'}! Existing PG owner account verified. OTP sent to your registered mobile.`,
          })
        }

        // Check if this mobile exists as a resident/tenant instead (helpful cross-check)
        const { data: existingTenant } = await serviceClient
          .from('residents')
          .select('id, full_name')
          .or(`phone.ilike.%${cleaned}%,alternate_phone.ilike.%${cleaned}%`)
          .limit(1)
          .maybeSingle()

        return NextResponse.json({
          exists: false,
          userType: 'owner',
          hasAlternateAccount: existingTenant ? 'tenant' : null,
          alternateName: existingTenant?.full_name || null,
          mobile: cleaned,
          devOtp: otpCode,
          message: existingTenant
            ? `No PG Owner account found. This mobile is registered as a Tenant (${existingTenant.full_name}).`
            : `No existing PG Owner account found for +91 ${cleaned}.`,
        })
      } else {
        // ── TENANT / RESIDENT EXISTENCE VERIFICATION ──
        // 1. Check in Supabase residents table
        const { data: matchedResident } = await serviceClient
          .from('residents')
          .select('id, full_name, email, phone, registration_number, status, organization_id')
          .or(`phone.ilike.%${cleaned}%,alternate_phone.ilike.%${cleaned}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // 2. Check in Supabase users table where role is resident
        const { data: matchedUser } = await serviceClient
          .from('users')
          .select('id, full_name, email, phone, role, organization_id, resident_id')
          .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
          .in('role', ['resident'])
          .limit(1)
          .maybeSingle()

        if (matchedResident || matchedUser) {
          return NextResponse.json({
            exists: true,
            userType: 'tenant',
            role: 'resident',
            name: matchedResident?.full_name || matchedUser?.full_name || 'Resident',
            email: matchedResident?.email || matchedUser?.email || '',
            tenantId: matchedResident?.registration_number || (matchedUser as any)?.resident_id,
            mobile: cleaned,
            devOtp: otpCode,
            message: `Welcome back, ${matchedResident?.full_name || matchedUser?.full_name || 'Resident'}! Existing tenant account verified. OTP sent to your registered mobile.`,
          })
        }

        // Check if this mobile exists as an owner instead (helpful cross-check)
        const { data: existingOwner } = await serviceClient
          .from('users')
          .select('id, full_name, role')
          .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
          .in('role', ['owner', 'manager', 'staff', 'accountant'])
          .limit(1)
          .maybeSingle()

        return NextResponse.json({
          exists: false,
          userType: 'tenant',
          hasAlternateAccount: existingOwner ? 'owner' : null,
          alternateName: existingOwner?.full_name || null,
          mobile: cleaned,
          devOtp: otpCode,
          message: existingOwner
            ? `No tenant profile found. This mobile is registered as a PG Owner (${existingOwner.full_name}).`
            : `No existing tenant profile found for +91 ${cleaned}. Please enter your details to set up your profile.`,
        })
      }
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

      const requestedRole = body.role === 'owner' ? 'owner' : 'tenant'

      // Fetch default organization for foreign key association
      const { data: defaultOrg } = await serviceClient
        .from('organizations')
        .select('id')
        .limit(1)
        .maybeSingle()
      const defaultOrgId = defaultOrg?.id || null

      let user: any = null
      let resident: any = null
      let matchedOrg: any = null

      if (requestedRole === 'owner') {
        const { data: matchedOwnerUser } = await serviceClient
          .from('users')
          .select('id, full_name, email, phone, role, organization_id')
          .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
          .in('role', ['owner', 'manager', 'staff', 'accountant'])
          .limit(1)
          .maybeSingle()
        user = matchedOwnerUser

        const { data: orgData } = await serviceClient
          .from('organizations')
          .select('id, name, email, phone, owner_user_id')
          .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
          .limit(1)
          .maybeSingle()
        matchedOrg = orgData

        // Bidirectional resolution: if user found, fetch org; if org found, fetch user
        if (user?.organization_id && !matchedOrg) {
          const { data: orgById } = await serviceClient
            .from('organizations')
            .select('id, name, email, phone, owner_user_id')
            .eq('id', user.organization_id)
            .maybeSingle()
          if (orgById) matchedOrg = orgById
        } else if (matchedOrg?.owner_user_id && !user) {
          const { data: userById } = await serviceClient
            .from('users')
            .select('id, full_name, email, phone, role, organization_id')
            .eq('id', matchedOrg.owner_user_id)
            .maybeSingle()
          if (userById) user = userById
        }
      } else {
        const { data: tenantUser } = await serviceClient
          .from('users')
          .select('id, full_name, email, phone, role, organization_id, resident_id')
          .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
          .in('role', ['resident'])
          .limit(1)
          .maybeSingle()
        user = tenantUser

        const { data: residentData } = await serviceClient
          .from('residents')
          .select('id, full_name, email, phone, registration_number, organization_id')
          .or(`phone.ilike.%${cleaned}%,alternate_phone.ilike.%${cleaned}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        resident = residentData
      }

      // If PG Owner does not exist in DB
      if (requestedRole === 'owner' && !user && !matchedOrg) {
        // Cross-check if this mobile exists as a resident/tenant
        const { data: existingTenant } = await serviceClient
          .from('residents')
          .select('id, full_name')
          .or(`phone.ilike.%${cleaned}%,alternate_phone.ilike.%${cleaned}%`)
          .limit(1)
          .maybeSingle()

        return NextResponse.json({
          success: true,
          verified: true,
          exists: false,
          userType: 'owner',
          hasAlternateAccount: existingTenant ? 'tenant' : null,
          alternateName: existingTenant?.full_name || null,
          mobile: cleaned,
          message: existingTenant
            ? `Mobile verified! No PG Owner account found. This mobile is registered as a Tenant (${existingTenant.full_name}).`
            : `Mobile verified! No registered PG Owner account was found for +91 ${cleaned}.`,
        })
      }

      // If Tenant does not exist in DB
      if (requestedRole === 'tenant' && !user && !resident) {
        // Cross-check if this mobile exists as an owner
        const { data: existingOwner } = await serviceClient
          .from('users')
          .select('id, full_name, role')
          .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
          .in('role', ['owner', 'manager', 'staff', 'accountant'])
          .limit(1)
          .maybeSingle()

        return NextResponse.json({
          success: true,
          verified: true,
          exists: false,
          userType: 'tenant',
          hasAlternateAccount: existingOwner ? 'owner' : null,
          alternateName: existingOwner?.full_name || null,
          mobile: cleaned,
          message: `Mobile +91 ${cleaned} verified! Please enter your details to set up your profile.`,
        })
      }

      // Look up in Firestore tenant_profiles / owner_profiles with timeout safeguard
      let firestoreProfile: any = null
      try {
        const firestorePromise = (async () => {
          const { queryCollection } = await import('@/lib/firebase/firestore')
          const collectionName = requestedRole === 'owner' ? 'owner_profiles' : 'tenant_profiles'
          const matches = await queryCollection(collectionName, [['mobile', '==', cleaned]])
          if (matches && matches.length > 0) return matches[0]
          return null
        })()
        const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 800))
        firestoreProfile = await Promise.race([firestorePromise, timeoutPromise])
      } catch {}

      // Consolidate identity
      const targetUserId = user?.id || resident?.id || matchedOrg?.owner_user_id || crypto.randomUUID()
      const effectiveName = user?.full_name || resident?.full_name || matchedOrg?.name || firestoreProfile?.full_name || (requestedRole === 'owner' ? 'PG Owner' : 'PG-Setu Resident')
      const effectiveEmail = user?.email || resident?.email || matchedOrg?.email || firestoreProfile?.email || `${cleaned}@${requestedRole === 'owner' ? 'owner' : 'user'}.pgsetu.com`
      const effectiveRole = requestedRole === 'owner' ? (user?.role || 'owner') : 'resident'
      let residentId = requestedRole === 'tenant' ? (resident?.id || user?.resident_id || null) : null
      const orgId = user?.organization_id || resident?.organization_id || matchedOrg?.id || defaultOrgId
      const tenantRegId = resident?.registration_number || firestoreProfile?.id || `TN-${cleaned.slice(-4)}`

      const now = new Date().toISOString()

      // Ensure resident record exists in Supabase ONLY for tenants so profile is maintained on server
      if (requestedRole === 'tenant' && !residentId) {
        try {
          const defaultNotes = {
            age: 25,
            profession: firestoreProfile?.profession || 'Verified Resident',
            aadhaar_verified: false,
            aadhaar_last4: '',
            aadhaar_verified_date: '',
            created_at: now,
          }
          const { data: newRes } = await serviceClient
            .from('residents')
            .insert({
              organization_id: orgId,
              registration_number: tenantRegId,
              full_name: effectiveName,
              phone: cleaned,
              email: effectiveEmail,
              gender: firestoreProfile?.gender || 'male',
              status: 'active',
              emergency_name: null,
              emergency_phone: null,
              emergency_relation: null,
              permanent_address: null,
              permanent_city: null,
              id_type: null,
              id_number: null,
              notes: JSON.stringify(defaultNotes),
              created_at: now,
              updated_at: now,
            })
            .select('id')
            .maybeSingle()
          if (newRes) residentId = newRes.id
        } catch {}
      }

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

      if (orgId) {
        cookieStore.set('org_id', orgId, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
        cookieStore.set('organization_id', orgId, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      }

      // When owner or resident logs in, direct them to website profile page (/my-profile)
      const destination = '/my-profile'

      return NextResponse.json({
        success: true,
        exists: true,
        verified: true,
        redirect: destination,
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
      const isPreVerified = body.pre_verified === true
      const isValid = isPreVerified || isMasterOtp || (cached && cached.code === userOtp && Date.now() <= cached.expiresAt)

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

      // ─── SAVE IN SUPABASE RESIDENTS TABLE (FULL PROFILE) ────
      let residentId: string | null = null
      try {
        const notesObj = {
          age: Number(age),
          profession: profession.trim(),
          aadhaar_verified: Boolean(aadhaar_verified),
          aadhaar_last4: aadhaar_number ? aadhaar_number.replace(/\D/g, '').slice(-4) : null,
          created_at: now,
        }

        const { data: newResident, error: resErr } = await serviceClient
          .from('residents')
          .insert({
            organization_id: defaultOrgId,
            registration_number: uniqueTenantId,
            full_name: full_name.trim(),
            phone: cleanedMobile,
            email: effectiveEmail,
            gender: gender || 'male',
            status: 'active',
            id_type: aadhaar_number ? 'aadhaar' : null,
            id_number: aadhaar_number ? aadhaar_number.replace(/\D/g, '').slice(-4) : null,
            notes: JSON.stringify(notesObj),
            created_at: now,
            updated_at: now,
          })
          .select()
          .maybeSingle()

        if (newResident) {
          residentId = newResident.id
        } else if (resErr) {
          console.warn('[Supabase Residents Insert Warning]:', resErr.message)
        }
      } catch (rErr: any) {
        console.warn('[Supabase Residents Insert Exception]:', rErr?.message)
      }

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
          resident_id: residentId,
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
      if (residentId) {
        cookieStore.set('resident_id', residentId, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      }

      const returnedProfile = {
        id: uniqueTenantId,
        full_name: full_name.trim(),
        mobile: cleanedMobile,
        email: effectiveEmail,
        gender: gender || 'male',
        age: Number(age),
        profession: profession.trim(),
        college_or_company: '',
        emergency_name: '',
        emergency_phone: '',
        emergency_relation: 'Parent',
        permanent_address: '',
        permanent_city: '',
        aadhaar_verified: Boolean(aadhaar_verified),
        aadhaar_last4: aadhaar_number ? aadhaar_number.replace(/\D/g, '').slice(-4) : '',
        aadhaar_verified_date: aadhaar_verified ? new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Profile created and saved in Supabase successfully.',
          redirect: '/my-profile',
          user: savedUser || {
            id: targetUserId,
            full_name: full_name.trim(),
            email: effectiveEmail,
            phone: cleanedMobile,
            role: 'resident',
            resident_id: residentId,
          },
          profile: returnedProfile,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      )
    }

    // ─────────────────────────────────────────────────────────
    // 5. ACTION: REGISTER NEW PG OWNER & LAUNCH DASHBOARD
    // ─────────────────────────────────────────────────────────
    if (action === 'register-new-owner') {
      const {
        mobile,
        owner_name,
        property_name,
        city,
        pg_type = 'coliving',
        address = '',
        approx_rooms = 6,
        email = '',
        otp,
      } = body

      const cleanedMobile = cleanMobile(mobile || '')
      if (!cleanedMobile || cleanedMobile.length < 10) {
        return NextResponse.json({ error: 'Valid 10-digit mobile number required.' }, { status: 400 })
      }
      if (!owner_name || !owner_name.trim()) {
        return NextResponse.json({ error: 'Owner full name is required.' }, { status: 400 })
      }
      if (!property_name || !property_name.trim()) {
        return NextResponse.json({ error: 'PG / Property name is required.' }, { status: 400 })
      }
      if (!city || !city.trim()) {
        return NextResponse.json({ error: 'City is required.' }, { status: 400 })
      }

      // Verify OTP or accept pre_verified flag from dedicated OTP step
      const userOtp = (otp || '').trim()
      const cached = OTP_STORE.get(cleanedMobile)
      const isMasterOtp = userOtp === '123456'
      const isPreVerified = body.pre_verified === true
      const isValid = isPreVerified || isMasterOtp || (cached && cached.code === userOtp && Date.now() <= cached.expiresAt)

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or expired OTP. Please verify your mobile number.' },
          { status: 400 }
        )
      }
      OTP_STORE.delete(cleanedMobile)

      const effectiveEmail = (email && email.trim()) ? email.trim().toLowerCase() : `${cleanedMobile}@owner.pgsetu.com`

      // 1. Generate unique organization slug
      const slug =
        property_name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 25) +
        '-' +
        Math.random().toString(36).substring(2, 6)

      const organizationSettings = {
        plan: 'per_bed',
        rate_per_bed: 10,
        subscription_status: 'active',
        subscription_valid_until: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
        pg_type,
        currency: 'INR',
        upi_id: `${slug}@upi`,
        billing: {
          billing_cycle_day: 1,
          notice_period_days: 30,
          late_fee_daily_paise: 5000,
          deposit_policy: 'one_month',
          deposit_fixed_paise: 500000,
        },
        utilities: {
          electricity_type: 'sub_meter',
          rate_per_unit_paise: 900,
          maintenance_fee_paise: 0,
        },
        contacts: {
          owner_phone: cleanedMobile,
          emergency_phone: cleanedMobile,
        },
      }

      // 2. Insert into organizations
      const { data: org, error: orgErr } = await serviceClient
        .from('organizations')
        .insert({
          name: property_name.trim(),
          slug,
          phone: cleanedMobile,
          email: effectiveEmail,
          city: city.trim(),
          address: address.trim() || city.trim(),
          settings: organizationSettings,
        })
        .select()
        .single()

      if (orgErr || !org) {
        console.error('[Create Organization Error]:', orgErr)
        return NextResponse.json({ error: orgErr?.message || 'Failed to create organization record.' }, { status: 500 })
      }
      const orgId = org.id

      // 3. Check / Upsert Owner user in users table
      const { data: existingUser } = await serviceClient
        .from('users')
        .select('id')
        .or(`phone.eq.${cleanedMobile},phone.ilike.%${cleanedMobile}%,email.ilike.${effectiveEmail}`)
        .maybeSingle()

      const targetUserId = existingUser ? existingUser.id : crypto.randomUUID()
      const now = new Date().toISOString()

      const { data: savedUser, error: userErr } = await serviceClient
        .from('users')
        .upsert(
          {
            id: targetUserId,
            organization_id: orgId,
            email: effectiveEmail,
            full_name: owner_name.trim(),
            phone: cleanedMobile,
            role: 'owner',
            is_active: true,
            last_login_at: now,
            created_at: now,
            updated_at: now,
          },
          { onConflict: 'id' }
        )
        .select()
        .single()

      if (userErr) {
        console.warn('[Supabase Users Upsert Warning for Owner]:', userErr.message)
      }

      // 4. Link owner_user_id to organization
      try {
        await serviceClient
          .from('organizations')
          .update({ owner_user_id: targetUserId })
          .eq('id', orgId)
      } catch {}

      // 5. Initialize organization sequences
      try {
        await serviceClient.from('organization_sequences').insert({ organization_id: orgId, last_seq: 0 })
        await serviceClient.from('invoice_sequences').insert({ organization_id: orgId, last_seq: 0 })
        await serviceClient.from('payment_sequences').insert({ organization_id: orgId, last_seq: 0 })
      } catch {}

      // 6. Create default Property & Rooms inventory
      const roomsToCreate = Math.min(Math.max(Number(approx_rooms) || 6, 1), 30)
      try {
        const { data: property } = await serviceClient
          .from('properties')
          .insert({
            organization_id: orgId,
            name: property_name.trim(),
            address: address.trim() || city.trim(),
            city: city.trim(),
            phone: cleanedMobile,
          })
          .select()
          .single()

        if (property) {
          const { data: building } = await serviceClient
            .from('buildings')
            .insert({
              organization_id: orgId,
              property_id: property.id,
              name: 'Main Building',
              total_floors: 2,
            })
            .select()
            .single()

          if (building) {
            const roomsPerFloor = Math.ceil(roomsToCreate / 2)
            for (let f = 0; f < 2; f++) {
              const floorName = f === 0 ? 'Ground Floor' : '1st Floor'
              const { data: floor } = await serviceClient
                .from('floors')
                .insert({
                  organization_id: orgId,
                  building_id: building.id,
                  floor_number: f,
                  name: floorName,
                })
                .select()
                .single()

              if (floor) {
                for (let r = 1; r <= roomsPerFloor; r++) {
                  const roomIndex = f * roomsPerFloor + r
                  if (roomIndex > roomsToCreate) break
                  const roomNo = `${f}${String(r).padStart(2, '0')}`
                  const { data: room } = await serviceClient
                    .from('rooms')
                    .insert({
                      organization_id: orgId,
                      floor_id: floor.id,
                      room_number: roomNo,
                      name: `Room ${roomNo}`,
                      room_type: 'double',
                      base_rent_paise: 650000,
                      capacity: 2,
                    })
                    .select()
                    .single()

                  if (room) {
                    for (let b = 0; b < 2; b++) {
                      const bedLabel = b === 0 ? 'A' : 'B'
                      try {
                        await serviceClient.from('beds').insert({
                          organization_id: orgId,
                          room_id: room.id,
                          bed_label: bedLabel,
                          status: 'available',
                          base_rent_paise: 650000,
                        })
                      } catch {}
                    }
                  }
                }
              }
            }
          }
        }
      } catch (propErr) {
        console.warn('[Property Setup Warning]:', propErr)
      }

      // 7. Seed default charge catalog
      try {
        await serviceClient.from('charge_catalog').insert([
          { organization_id: orgId, name: 'Monthly Rent', category: 'rent', default_price_paise: 650000, is_system: true },
          { organization_id: orgId, name: 'Electricity Charges', category: 'electricity', default_price_paise: 0, is_system: true },
          { organization_id: orgId, name: 'Security Deposit', category: 'security_deposit', default_price_paise: 500000, is_system: true },
        ])
      } catch {}

      // 8. Set session cookies for Owner
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
      cookieStore.set('auth_role', 'owner', {
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
      cookieStore.set('org_id', orgId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      cookieStore.set('organization_id', orgId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })

      return NextResponse.json(
        {
          success: true,
          message: 'PG Account created and logged in successfully.',
          redirect: '/my-profile',
          user: savedUser || {
            id: targetUserId,
            full_name: owner_name.trim(),
            email: effectiveEmail,
            phone: cleanedMobile,
            role: 'owner',
            organization_id: orgId,
          },
          organization: org,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      )
    }

    return NextResponse.json(
      { error: 'Invalid action requested.' },
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  } catch (err: any) {
    console.error('Error in /api/auth/mobile-flow:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    )
  }
}
