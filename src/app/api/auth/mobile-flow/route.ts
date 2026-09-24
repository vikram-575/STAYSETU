import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { cleanMobile, isValidMobile, generateTenantId } from '@/lib/profiles'
import { isKnownSuperAdmin, signAdminToken } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Strips synthetic / generated fallback emails so we never invent or expose fake emails.
 * Only returns genuine emails explicitly entered by the user.
 */
function cleanUserEmail(email?: string | null): string {
  if (!email) return ''
  const trimmed = email.trim().toLowerCase()
  if (
    trimmed.includes('@owner.pgsetu.') ||
    trimmed.includes('@user.pgsetu.') ||
    trimmed.includes('@resident.pgsetu.') ||
    trimmed.includes('@pgsetu.online') ||
    trimmed.includes('@pgsetu.local') ||
    (trimmed.includes('@pgsetu.com') && !trimmed.includes('contact@') && !trimmed.includes('support@'))
  ) {
    return ''
  }
  return trimmed
}

/**
 * Formats 10-digit Indian phone to E.164 (+91XXXXXXXXXX) required by Supabase Auth / SMS gateways
 */
function formatPhoneE164(mobile: string): string {
  const digits = mobile.replace(/\D/g, '').slice(-10)
  return `+91${digits}`
}

/**
 * Validates Firebase ID Token from client-side Firebase Phone Auth
 * (Connected via Supabase Third-Party Auth: staysetu-1bf2f)
 */
async function verifyFirebaseToken(
  idToken?: string,
  targetPhone?: string
): Promise<{ valid: boolean; uid?: string; phone?: string }> {
  if (!idToken) return { valid: false }
  try {
    const { getAdminAuth } = await import('@/lib/firebase/admin')
    const adminAuth = getAdminAuth()
    if (adminAuth) {
      const decoded = await adminAuth.verifyIdToken(idToken)
      const tokenPhone = cleanMobile(decoded.phone_number || '')
      if (!targetPhone || tokenPhone === targetPhone || !tokenPhone) {
        return { valid: true, uid: decoded.uid, phone: tokenPhone }
      }
    } else {
      const parts = idToken.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        const tokenPhone = cleanMobile(payload.phone_number || '')
        if (payload.aud === 'staysetu-1bf2f' && (!targetPhone || tokenPhone === targetPhone || !tokenPhone)) {
          return { valid: true, uid: payload.sub || payload.user_id, phone: tokenPhone }
        }
      }
    }
  } catch (e: any) {
    console.warn('[Firebase Auth ID Token Verification Warning]:', e?.message)
  }
  return { valid: false }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    const serviceClient = await createServiceClient()
    const cookieStore = await cookies()

    // ─────────────────────────────────────────────────────────
    // 1. ACTION: CHECK MOBILE NUMBER & DISPATCH REAL SUPABASE OTP
    // ─────────────────────────────────────────────────────────
    if (action === 'check-mobile') {
      const rawMobile = body.mobile || ''
      const cleaned = cleanMobile(rawMobile)
      const requestedRole = body.role === 'owner' ? 'owner' : 'tenant'
      const skipOtpDispatch = Boolean(body.skipOtpDispatch)

      if (!cleaned || cleaned.length < 10) {
        return NextResponse.json(
          { error: 'Please enter a valid 10-digit Indian mobile number.' },
          { status: 400 }
        )
      }

      const formattedPhone = formatPhoneE164(cleaned)

      // ── Dispatch REAL OTP via Supabase Phone Auth Provider if not handled by client (e.g. Firebase) ──
      if (!skipOtpDispatch) {
        const { error: otpError } = await serviceClient.auth.signInWithOtp({
          phone: formattedPhone,
        })

        if (otpError) {
          console.error('[Supabase signInWithOtp Error]:', otpError.message)
          if (
            otpError.code === 'phone_provider_disabled' ||
            otpError.message?.toLowerCase().includes('unsupported phone provider') ||
            otpError.message?.toLowerCase().includes('phone provider disabled')
          ) {
            return NextResponse.json(
              {
                error: 'Supabase Phone Auth is not enabled. Please use Firebase Phone Authentication.',
                code: 'phone_provider_disabled',
              },
              { status: 400 }
            )
          }
          return NextResponse.json(
            { error: otpError.message || 'Failed to send OTP via SMS. Please verify your mobile number.' },
            { status: 400 }
          )
        }
      }

      if (requestedRole === 'owner') {
        // ── PG OWNER EXISTENCE VERIFICATION ──
        let { data: matchedOwnerUser } = await serviceClient
          .from('users')
          .select('id, full_name, email, phone, role, organization_id')
          .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
          .in('role', ['owner', 'manager', 'staff', 'accountant'])
          .limit(1)
          .maybeSingle()

        let { data: matchedOrg } = await serviceClient
          .from('organizations')
          .select('id, name, email, phone, owner_user_id')
          .or(`phone.eq.${cleaned},phone.ilike.%${cleaned}%`)
          .limit(1)
          .maybeSingle()

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
          const targetOrgId = matchedOwnerUser?.organization_id || matchedOrg?.id
          let ownerProperties: any[] = []
          let orgSettings: any = null

          if (targetOrgId) {
            const [
              { data: props },
              { data: orgFull }
            ] = await Promise.all([
              serviceClient
                .from('properties')
                .select('id, name, city, state, pincode, address, phone, is_active')
                .eq('organization_id', targetOrgId)
                .order('created_at', { ascending: false }),
              serviceClient
                .from('organizations')
                .select('id, name, city, state, pincode, address, gst_enabled, gstin, settings')
                .eq('id', targetOrgId)
                .maybeSingle()
            ])
            ownerProperties = props || []
            orgSettings = orgFull
          }

          return NextResponse.json({
            exists: true,
            userType: 'owner',
            role: matchedOwnerUser?.role || 'owner',
            name: matchedOwnerUser?.full_name || matchedOrg?.name || 'PG Owner',
            userId: matchedOwnerUser?.id || matchedOrg?.owner_user_id || null,
            organizationId: targetOrgId,
            organizationName: matchedOrg?.name || orgSettings?.name || null,
            email: cleanUserEmail(matchedOwnerUser?.email || matchedOrg?.email),
            mobile: cleaned,
            properties: ownerProperties,
            organization: orgSettings,
            message: `Welcome back, ${matchedOwnerUser?.full_name || matchedOrg?.name || 'Owner'}! Found ${ownerProperties.length} existing properties.`,
          })
        }

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
          message: existingTenant
            ? `No PG Owner account found. This mobile is registered as a Tenant (${existingTenant.full_name}). Real OTP sent to your phone.`
            : `Real OTP sent to +91 ${cleaned.slice(0, 2)}******${cleaned.slice(-2)}.`,
        })
      } else {
        // ── TENANT / RESIDENT EXISTENCE VERIFICATION ──
        const { data: matchedResident } = await serviceClient
          .from('residents')
          .select('id, full_name, email, phone, registration_number, status, organization_id')
          .or(`phone.ilike.%${cleaned}%,alternate_phone.ilike.%${cleaned}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

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
            email: cleanUserEmail(matchedResident?.email || matchedUser?.email),
            tenantId: matchedResident?.registration_number || (matchedUser as any)?.resident_id,
            mobile: cleaned,
            message: `Welcome back, ${matchedResident?.full_name || matchedUser?.full_name || 'Resident'}! Real OTP sent to +91 ${cleaned.slice(0, 2)}******${cleaned.slice(-2)}.`,
          })
        }

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
          message: existingOwner
            ? `No tenant profile found. This mobile is registered as a PG Owner (${existingOwner.full_name}). Real OTP sent to your phone.`
            : `Real OTP sent to +91 ${cleaned.slice(0, 2)}******${cleaned.slice(-2)}.`,
        })
      }
    }

    // ─────────────────────────────────────────────────────────
    // 2. ACTION: SEND REAL OTP VIA SUPABASE
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

      const formattedPhone = formatPhoneE164(cleaned)

      const { error: otpError } = await serviceClient.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (otpError) {
        console.error('[Supabase signInWithOtp Error]:', otpError.message)
        if (
          otpError.code === 'phone_provider_disabled' ||
          otpError.message?.toLowerCase().includes('unsupported phone provider') ||
          otpError.message?.toLowerCase().includes('phone provider disabled')
        ) {
          return NextResponse.json(
            {
              error: 'Supabase Phone Auth is disabled. Please enable Phone provider in your Supabase Dashboard under Authentication -> Providers -> Phone.',
              code: 'phone_provider_disabled',
            },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: otpError.message || 'Failed to dispatch OTP SMS.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent via SMS to +91 ' + cleaned.slice(0, 2) + '******' + cleaned.slice(-2),
      })
    }

    // ─────────────────────────────────────────────────────────
    // 2B. ACTION: VERIFY RESIDENT OTP (FOR OWNER CHECK-IN WORKFLOW)
    // ─────────────────────────────────────────────────────────
    if (action === 'verify-resident-otp') {
      const rawMobile = body.mobile || ''
      const cleaned = cleanMobile(rawMobile)
      const userOtp = (body.otp || '').trim()
      const idToken = body.idToken

      // If verified via client Firebase Phone Auth token
      if (idToken) {
        const fbResult = await verifyFirebaseToken(idToken, cleaned)
        if (fbResult.valid) {
          return NextResponse.json({
            success: true,
            verified: true,
            mobile: cleaned,
          })
        }
      }

      if (!userOtp || userOtp.length < 6) {
        return NextResponse.json(
          { error: 'Please enter the complete 6-digit OTP.' },
          { status: 400 }
        )
      }

      const formattedPhone = formatPhoneE164(cleaned)

      // Fallback verification with Supabase Auth
      const { error: verifyError } = await serviceClient.auth.verifyOtp({
        phone: formattedPhone,
        token: userOtp,
        type: 'sms',
      })

      if (verifyError) {
        return NextResponse.json(
          { error: verifyError.message || 'Invalid or expired OTP. Please enter the correct code received on mobile.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        verified: true,
        mobile: cleaned,
      })
    }

    // ─────────────────────────────────────────────────────────
    // 3. ACTION: VERIFY REAL OTP LOGIN & ESTABLISH SESSION (FIREBASE & SUPABASE)
    // ─────────────────────────────────────────────────────────
    if (action === 'verify-otp-login') {
      const rawMobile = body.mobile || ''
      const cleaned = cleanMobile(rawMobile)
      const userOtp = (body.otp || '').trim()
      const idToken = body.idToken

      let isVerified = false
      let firebaseUid = ''

      // ── Third-Party Auth: Verify Firebase ID Token if provided ──
      if (idToken) {
        const fbResult = await verifyFirebaseToken(idToken, cleaned)
        if (fbResult.valid) {
          isVerified = true
          firebaseUid = fbResult.uid || ''
        }
      }

      // If not verified by Firebase ID token, verify OTP via Supabase Auth
      if (!isVerified) {
        if (!userOtp || userOtp.length < 6) {
          return NextResponse.json(
            { error: 'Please enter the 6-digit OTP code received on your mobile.' },
            { status: 400 }
          )
        }

        const formattedPhone = formatPhoneE164(cleaned)
        const { error: verifyError } = await serviceClient.auth.verifyOtp({
          phone: formattedPhone,
          token: userOtp,
          type: 'sms',
        })

        if (verifyError) {
          return NextResponse.json(
            { error: verifyError.message || 'Invalid or expired OTP. Please verify the code sent to your phone.' },
            { status: 400 }
          )
        }
        isVerified = true
      }

      // Mark mobile verified in session cookie for subsequent profile creation steps (15 mins)
      cookieStore.set('verified_mobile', cleaned, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60,
        path: '/',
      })

      const requestedRole = body.role === 'owner' ? 'owner' : 'tenant'

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

      // If PG Owner does not exist in DB yet
      if (requestedRole === 'owner' && !user && !matchedOrg) {
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

      // If Tenant does not exist in DB yet
      if (requestedRole === 'tenant' && !user && !resident) {
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

      // Consolidate identity — DO NOT generate synthetic fake emails
      const targetUserId = firebaseUid || user?.id || resident?.id || matchedOrg?.owner_user_id || crypto.randomUUID()
      const effectiveName = user?.full_name || resident?.full_name || matchedOrg?.name || (requestedRole === 'owner' ? 'PG Owner' : 'PG-Setu Resident')
      const rawFoundEmail = user?.email || resident?.email || matchedOrg?.email || ''
      const effectiveEmail = cleanUserEmail(rawFoundEmail)
      const effectiveRole = requestedRole === 'owner' ? (user?.role || 'owner') : 'resident'
      let residentId = requestedRole === 'tenant' ? (resident?.id || user?.resident_id || null) : null
      const orgId = requestedRole === 'owner'
        ? (user?.organization_id || matchedOrg?.id || null)
        : (resident?.organization_id || user?.organization_id || null)
      const tenantRegId = resident?.registration_number || `TN-${cleaned.slice(-4)}`

      const now = new Date().toISOString()

      // ─── SAVE / UPSERT SIGNED-IN USER IN SUPABASE ───────────
      const { data: savedUser, error: saveErr } = await serviceClient
        .from('users')
        .upsert({
          id: targetUserId,
          organization_id: orgId,
          email: effectiveEmail, // Empty string if not provided by user, never a fake email!
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

      if (effectiveEmail) {
        cookieStore.set('auth_email', effectiveEmail, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      } else {
        cookieStore.delete('auth_email')
      }

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
      } else {
        cookieStore.delete('resident_id')
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
      } else {
        cookieStore.delete('org_id')
        cookieStore.delete('organization_id')
      }

      if (isKnownSuperAdmin(effectiveEmail, effectiveRole, targetUserId, cleaned)) {
        const adminToken = await signAdminToken(effectiveEmail || 'vikramtomar0505@gmail.com')
        cookieStore.set('superadmin_token', adminToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      }

      const isErpUnlocked = requestedRole === 'owner'
        ? Boolean(orgId || user?.organization_id)
        : true

      if (!isErpUnlocked) {
        cookieStore.set('erp_locked', 'true', {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      } else {
        cookieStore.delete('erp_locked')
      }

      return NextResponse.json({
        success: true,
        exists: true,
        verified: true,
        erp_unlocked: isErpUnlocked,
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
    // 4. ACTION: REGISTER NEW USER (TENANT)
    // ─────────────────────────────────────────────────────────
    if (action === 'register-new-user') {
      const {
        mobile,
        full_name,
        gender,
        age,
        dob,
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
      if (!dob || !dob.trim()) {
        return NextResponse.json({ error: 'Date of Birth (DOB) is mandatory.' }, { status: 400 })
      }
      if (!gender) {
        return NextResponse.json({ error: 'Gender is required.' }, { status: 400 })
      }

      // Calculate or validate age from DOB
      let effectiveAge = Number(age)
      if (isNaN(effectiveAge) || effectiveAge <= 0) {
        const birthDate = new Date(dob)
        if (!isNaN(birthDate.getTime())) {
          const today = new Date()
          effectiveAge = today.getFullYear() - birthDate.getFullYear()
          const m = today.getMonth() - birthDate.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            effectiveAge--
          }
        }
      }
      if (effectiveAge < 16 || effectiveAge > 100) {
        return NextResponse.json({ error: 'Valid age (16-100) is required.' }, { status: 400 })
      }
      if (!profession || !profession.trim()) {
        return NextResponse.json({ error: 'Profession is required.' }, { status: 400 })
      }

      // Check session verification, Firebase ID Token, or real OTP
      const isSessionVerified = cookieStore.get('verified_mobile')?.value === cleanedMobile
      let isVerified = isSessionVerified

      if (!isVerified && body.idToken) {
        const fbResult = await verifyFirebaseToken(body.idToken, cleanedMobile)
        if (fbResult.valid) {
          isVerified = true
        }
      }

      if (!isVerified) {
        const userOtp = (otp || '').trim()
        if (!userOtp || userOtp.length < 6) {
          return NextResponse.json(
            { error: 'Please enter the 6-digit OTP sent to your phone to complete registration.' },
            { status: 400 }
          )
        }
        const { error: verifyError } = await serviceClient.auth.verifyOtp({
          phone: formatPhoneE164(cleanedMobile),
          token: userOtp,
          type: 'sms',
        })
        if (verifyError) {
          return NextResponse.json(
            { error: verifyError.message || 'Invalid or expired OTP.' },
            { status: 400 }
          )
        }
        isVerified = true
      }

      // Clean email — NEVER fabricate fake email
      const effectiveEmail = cleanUserEmail(email)

      // Canonical Tenant ID (e.g. TN2026-X8K)
      const uniqueTenantId = generateTenantId()
      
      const { data: existingUser } = await serviceClient
        .from('users')
        .select('id')
        .or(`phone.eq.${cleanedMobile},phone.ilike.%${cleanedMobile}%`)
        .maybeSingle()

      const targetUserId = existingUser ? existingUser.id : crypto.randomUUID()
      const now = new Date().toISOString()

      // Save in Supabase users table
      const { data: savedUser, error: saveErr } = await serviceClient
        .from('users')
        .upsert({
          id: targetUserId,
          organization_id: null,
          email: effectiveEmail, // Empty string if not filled by user
          full_name: full_name.trim(),
          phone: cleanedMobile,
          role: 'resident',
          resident_id: null,
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

      // Prepare profile in Firestore
      try {
        const { createDocument } = await import('@/lib/firebase/firestore')
        await createDocument(
          'tenant_profiles',
          {
            id: uniqueTenantId,
            user_id: targetUserId,
            full_name: full_name.trim(),
            mobile: cleanedMobile,
            email: effectiveEmail || null,
            gender,
            age: effectiveAge,
            dob: dob.trim(),
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

      // Set cookies
      cookieStore.set('auth_user_id', targetUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      if (effectiveEmail) {
        cookieStore.set('auth_email', effectiveEmail, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      } else {
        cookieStore.delete('auth_email')
      }
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
      cookieStore.delete('resident_id')
      cookieStore.delete('org_id')
      cookieStore.delete('organization_id')

      const returnedProfile = {
        id: uniqueTenantId,
        full_name: full_name.trim(),
        mobile: cleanedMobile,
        email: effectiveEmail,
        gender: gender || 'male',
        age: effectiveAge,
        dob: dob.trim(),
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
          message: 'Profile registered successfully.',
          redirect: '/my-profile',
          user: savedUser || {
            id: targetUserId,
            full_name: full_name.trim(),
            email: effectiveEmail,
            phone: cleanedMobile,
            role: 'resident',
            resident_id: null,
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
    // 5. ACTION: REGISTER NEW PG OWNER (PERSONAL DETAILS ONLY)
    // ─────────────────────────────────────────────────────────
    if (action === 'register-new-owner') {
      const {
        mobile,
        owner_name,
        dob,
        gender = 'male',
        city,
        email = '',
        otp,
      } = body

      const cleanedMobile = cleanMobile(mobile || '')
      if (!cleanedMobile || cleanedMobile.length < 10) {
        return NextResponse.json({ error: 'Valid 10-digit mobile number required.' }, { status: 400 })
      }
      if (!owner_name || !owner_name.trim()) {
        return NextResponse.json({ error: 'Full Name is required.' }, { status: 400 })
      }
      if (!dob || !dob.trim()) {
        return NextResponse.json({ error: 'Date of Birth (DOB) is mandatory.' }, { status: 400 })
      }
      if (!city || !city.trim()) {
        return NextResponse.json({ error: 'Personal city of residence is required.' }, { status: 400 })
      }

      // Check session verification, Firebase ID Token, or real OTP
      const isSessionVerified = cookieStore.get('verified_mobile')?.value === cleanedMobile
      let isVerified = isSessionVerified

      if (!isVerified && body.idToken) {
        const fbResult = await verifyFirebaseToken(body.idToken, cleanedMobile)
        if (fbResult.valid) {
          isVerified = true
        }
      }

      if (!isVerified) {
        const userOtp = (otp || '').trim()
        if (!userOtp || userOtp.length < 6) {
          return NextResponse.json(
            { error: 'Please enter the 6-digit OTP sent to your phone to complete registration.' },
            { status: 400 }
          )
        }
        const { error: verifyError } = await serviceClient.auth.verifyOtp({
          phone: formatPhoneE164(cleanedMobile),
          token: userOtp,
          type: 'sms',
        })
        if (verifyError) {
          return NextResponse.json(
            { error: verifyError.message || 'Invalid or expired OTP.' },
            { status: 400 }
          )
        }
        isVerified = true
      }

      // Clean email — NEVER fabricate fake email
      const effectiveEmail = cleanUserEmail(email)
      const now = new Date().toISOString()

      // Check if user record exists
      const { data: existingUser } = await serviceClient
        .from('users')
        .select('id, organization_id')
        .or(`phone.eq.${cleanedMobile},phone.ilike.%${cleanedMobile}%`)
        .maybeSingle()

      const targetUserId = existingUser ? existingUser.id : crypto.randomUUID()

      // Upsert in users table with role: 'owner'
      const { data: savedUser, error: userErr } = await serviceClient
        .from('users')
        .upsert(
          {
            id: targetUserId,
            organization_id: existingUser?.organization_id || null,
            email: effectiveEmail, // Empty string if not filled by user
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

      // Generate Owner ID
      const ownerId = `OW-${cleanedMobile.slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`

      // Save in Firestore owner_profiles
      try {
        const { createDocument } = await import('@/lib/firebase/firestore')
        await createDocument(
          'owner_profiles',
          {
            id: ownerId,
            user_id: targetUserId,
            full_name: owner_name.trim(),
            mobile: cleanedMobile,
            email: effectiveEmail || null,
            dob: dob.trim(),
            gender,
            city: city.trim(),
            operating_cities: [city.trim()],
            property_types: [],
            profile_status: 'pending',
            onboarding_status: 'pending_superadmin',
            erp_unlocked: false,
            can_list_properties: false,
            verified_mobile: true,
            created_at: now,
            updated_at: now,
          },
          ownerId
        )
      } catch (fErr: any) {
        console.warn('[Firestore Owner Profile Save Warning]:', fErr?.message)
      }

      // Set session cookies
      cookieStore.set('auth_user_id', targetUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
      if (effectiveEmail) {
        cookieStore.set('auth_email', effectiveEmail, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30,
          path: '/',
        })
      } else {
        cookieStore.delete('auth_email')
      }
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
      cookieStore.delete('org_id')
      cookieStore.delete('organization_id')
      cookieStore.set('erp_locked', 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })

      return NextResponse.json(
        {
          success: true,
          erp_locked: true,
          message: 'Owner profile registered successfully.',
          redirect: '/my-profile',
          user: savedUser || {
            id: targetUserId,
            full_name: owner_name.trim(),
            email: effectiveEmail,
            phone: cleanedMobile,
            role: 'owner',
            organization_id: null,
          },
          profile: {
            id: ownerId,
            full_name: owner_name.trim(),
            mobile: cleanedMobile,
            email: effectiveEmail,
            dob: dob.trim(),
            gender,
            city: city.trim(),
            erp_unlocked: false,
            onboarding_status: 'pending_superadmin',
          },
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
