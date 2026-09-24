import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config'
import { isSuperAdminFromRequest, isKnownSuperAdmin, SUPER_ADMIN_EMAILS, isProtectedSuperAdminIdentity } from '@/lib/admin-auth'

async function requireSuperAdmin(request: NextRequest) {
  if (isSuperAdminFromRequest(request)) {
    return { role: 'superadmin' }
  }
  try {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    if (isKnownSuperAdmin(user.email, user.user_metadata?.role, user.id, user.phone)) {
      return user
    }
    const service = await createServiceClient()
    const { data: profile } = await service.from('users').select('role, email, phone').eq('id', user.id).maybeSingle()
    if (profile && isKnownSuperAdmin(profile.email || user.email, profile.role, user.id, profile.phone)) {
      return user
    }
    return null
  } catch {
    return null
  }
}

/**
 * GET /api/admin/users
 * List all platform users and comprehensive profiles (Owners & Tenants)
 * Super Admin only
 */
export async function GET(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request)
  if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

  try {
    const supabase = await createServiceClient()
    const url = new URL(request.url)
    const roleFilter = url.searchParams.get('role')?.toLowerCase().trim()
    const searchQuery = url.searchParams.get('search')?.toLowerCase().trim()

    // Fetch across platform tables in parallel
    const [
      { data: users, error: uErr },
      { data: residents, error: rErr },
      { data: orgs, error: oErr },
      { data: properties, error: pErr }
    ] = await Promise.all([
      supabase
        .from('users')
        .select('id, full_name, email, phone, role, is_active, last_login_at, created_at, organization_id, organizations(id, name, slug, phone, email, city)')
        .order('created_at', { ascending: false }),
      supabase
        .from('residents')
        .select(`
          id, registration_number, full_name, phone, alternate_phone, email, photo_url,
          date_of_birth, gender, status, created_at, organization_id,
          permanent_address, permanent_city, permanent_state, permanent_pincode,
          emergency_name, emergency_phone, emergency_relation, id_type, id_number,
          organizations(id, name),
          resident_assignments(
            id, monthly_rent_paise, check_in_date, check_out_date,
            beds(id, bed_label, rooms(id, room_number, floors(name, buildings(name, properties(id, name, city)))))
          )
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('organizations')
        .select('id, name, owner_user_id, phone, email, city, settings'),
      supabase
        .from('properties')
        .select('id, name, city, organization_id')
    ])

    if (uErr) throw uErr

    // Map properties by organization
    const orgPropsMap = new Map<string, Array<{ id: string; name: string; city: string }>>()
    ;(properties || []).forEach((p: any) => {
      if (!p.organization_id) return
      if (!orgPropsMap.has(p.organization_id)) orgPropsMap.set(p.organization_id, [])
      orgPropsMap.get(p.organization_id)!.push({ id: p.id, name: p.name, city: p.city })
    })

    // Map organizations by ID
    const orgMap = new Map<string, any>()
    ;(orgs || []).forEach((o: any) => orgMap.set(o.id, o))

    const allProfiles: any[] = []
    const handledEmails = new Set<string>()
    const handledPhones = new Set<string>()

    // 1. Process platform users from users table
    ;(users || []).forEach((u: any) => {
      const org = u.organization_id ? orgMap.get(u.organization_id) : null
      const orgProps = u.organization_id ? (orgPropsMap.get(u.organization_id) || []) : []
      const isSuper = u.role === 'superadmin' || isKnownSuperAdmin(u.email, u.role, u.id, u.phone)
      const isAdmin = isSuper || u.role === 'admin'
      const isOwner = !isAdmin && (u.role === 'owner' || (org && org.owner_user_id === u.id))
      const isStaff = !isAdmin && (u.role === 'manager' || u.role === 'staff')

      let user_type = 'tenant'
      let displayRole = 'Resident / Tenant'
      if (isSuper) {
        user_type = 'admin'
        displayRole = 'Super Admin'
      } else if (isAdmin) {
        user_type = 'admin'
        displayRole = 'Admin'
      } else if (isOwner) {
        user_type = 'owner'
        displayRole = 'PG Owner'
      } else if (isStaff) {
        user_type = 'staff'
        displayRole = 'Property Manager'
      }

      // Check if resident record matches for deeper stay details
      const cleanEmail = u.email?.toLowerCase().trim()
      const cleanPhone = u.phone?.replace(/\D/g, '')

      const matchedRes = (residents || []).find((r: any) =>
        (cleanEmail && r.email && r.email.toLowerCase().trim() === cleanEmail) ||
        (cleanPhone && r.phone && r.phone.replace(/\D/g, '') === cleanPhone)
      )

      const activeAssignment: any = (matchedRes?.resident_assignments as any)?.find((a: any) => !a.check_out_date) || (matchedRes?.resident_assignments as any)?.[0]
      const bed: any = Array.isArray(activeAssignment?.beds) ? activeAssignment?.beds[0] : activeAssignment?.beds
      const room: any = Array.isArray(bed?.rooms) ? bed?.rooms[0] : bed?.rooms
      const floor: any = Array.isArray(room?.floors) ? room?.floors[0] : room?.floors
      const building: any = Array.isArray(floor?.buildings) ? floor?.buildings[0] : floor?.buildings
      const prop: any = Array.isArray(building?.properties) ? building?.properties[0] : building?.properties

      const orgName = (Array.isArray(u.organizations) ? u.organizations[0]?.name : (u.organizations as any)?.name) ||
        org?.name ||
        (Array.isArray(matchedRes?.organizations) ? matchedRes?.organizations[0]?.name : (matchedRes?.organizations as any)?.name) ||
        (isAdmin ? 'PG-SETU Platform HQ' : 'Independent Space')

      const profile = {
        id: u.id,
        full_name: u.full_name || matchedRes?.full_name || 'Platform User',
        email: u.email,
        phone: u.phone || matchedRes?.phone || null,
        alternate_phone: matchedRes?.alternate_phone || null,
        role: isSuper ? 'superadmin' : u.role,
        user_type,
        display_role: displayRole,
        is_active: u.is_active ?? true,
        status: matchedRes?.status || (u.is_active ? 'active' : 'inactive'),
        created_at: u.created_at,
        last_login_at: u.last_login_at,
        organization_id: u.organization_id || matchedRes?.organization_id || null,
        organization_name: orgName,
        properties_count: orgProps.length,
        properties_list: orgProps,

        // Resident / Stay Details if Tenant
        resident_id: matchedRes?.id || null,
        registration_number: matchedRes?.registration_number || null,
        property_name: prop?.name || (isOwner ? `${orgProps.length} Hosted Properties` : null),
        room_number: room?.room_number || null,
        bed_label: bed?.bed_label || null,
        monthly_rent_paise: activeAssignment?.monthly_rent_paise || 0,
        check_in_date: activeAssignment?.check_in_date || null,
        gender: matchedRes?.gender || null,
        date_of_birth: matchedRes?.date_of_birth || null,
        emergency_name: matchedRes?.emergency_name || null,
        emergency_phone: matchedRes?.emergency_phone || null,
        emergency_relation: matchedRes?.emergency_relation || null,
        id_type: matchedRes?.id_type || null,
        id_number: matchedRes?.id_number || null,
        permanent_address: matchedRes?.permanent_address || null,
        permanent_city: matchedRes?.permanent_city || null,
        permanent_state: matchedRes?.permanent_state || null,
        source: 'user_account',
      }

      if (cleanEmail) handledEmails.add(cleanEmail)
      if (cleanPhone) handledPhones.add(cleanPhone)
      allProfiles.push(profile)
    })

    // 2. Process residents not yet included from users table
    ;(residents || []).forEach((r: any) => {
      const cleanEmail = r.email?.toLowerCase().trim()
      const cleanPhone = r.phone?.replace(/\D/g, '')

      if ((cleanEmail && handledEmails.has(cleanEmail)) || (cleanPhone && handledPhones.has(cleanPhone))) {
        return // already linked and processed above
      }

      const activeAssignment: any = (r.resident_assignments as any)?.find((a: any) => !a.check_out_date) || (r.resident_assignments as any)?.[0]
      const bed: any = Array.isArray(activeAssignment?.beds) ? activeAssignment?.beds[0] : activeAssignment?.beds
      const room: any = Array.isArray(bed?.rooms) ? bed?.rooms[0] : bed?.rooms
      const floor: any = Array.isArray(room?.floors) ? room?.floors[0] : room?.floors
      const building: any = Array.isArray(floor?.buildings) ? floor?.buildings[0] : floor?.buildings
      const prop: any = Array.isArray(building?.properties) ? building?.properties[0] : building?.properties
      const residentOrgName = Array.isArray(r.organizations) ? r.organizations[0]?.name : (r.organizations as any)?.name

      allProfiles.push({
        id: r.id,
        full_name: r.full_name,
        email: r.email || 'No email registered',
        phone: r.phone || null,
        alternate_phone: r.alternate_phone || null,
        role: 'resident',
        user_type: 'tenant',
        display_role: 'Resident / Tenant',
        is_active: r.status === 'active',
        status: r.status || 'active',
        created_at: r.created_at,
        last_login_at: null,
        organization_id: r.organization_id,
        organization_name: residentOrgName || 'Assigned PG',
        properties_count: 0,
        properties_list: [],

        // Resident details
        resident_id: r.id,
        registration_number: r.registration_number,
        property_name: prop?.name || 'Assigned PG',
        room_number: room?.room_number || null,
        bed_label: bed?.bed_label || null,
        monthly_rent_paise: activeAssignment?.monthly_rent_paise || 0,
        check_in_date: activeAssignment?.check_in_date || null,
        gender: r.gender || null,
        date_of_birth: r.date_of_birth || null,
        emergency_name: r.emergency_name || null,
        emergency_phone: r.emergency_phone || null,
        emergency_relation: r.emergency_relation || null,
        id_type: r.id_type || null,
        id_number: r.id_number || null,
        permanent_address: r.permanent_address || null,
        permanent_city: r.permanent_city || null,
        permanent_state: r.permanent_state || null,
        source: 'resident_registry',
      })

      if (cleanEmail) handledEmails.add(cleanEmail)
      if (cleanPhone) handledPhones.add(cleanPhone)
    })

    // 3. Process organizations / PG hosts not yet included from users table
    ;(orgs || []).forEach((o: any) => {
      const orgEmail = o.email?.toLowerCase().trim()
      const orgPhone = o.phone?.replace(/\D/g, '')

      if ((orgEmail && handledEmails.has(orgEmail)) || (orgPhone && handledPhones.has(orgPhone))) {
        return
      }

      const orgProps = orgPropsMap.get(o.id) || []
      allProfiles.push({
        id: o.owner_user_id || o.id,
        full_name: o.name || 'PG Host Organization',
        email: o.email || 'No email registered',
        phone: o.phone || null,
        alternate_phone: null,
        role: 'owner',
        user_type: 'owner',
        display_role: 'PG Owner',
        is_active: true,
        status: 'active',
        created_at: o.created_at || new Date().toISOString(),
        last_login_at: null,
        organization_id: o.id,
        organization_name: o.name,
        properties_count: orgProps.length,
        properties_list: orgProps,
        property_name: orgProps[0]?.name || (orgProps.length > 0 ? `${orgProps.length} Hosted Properties` : 'Operating Space'),
        source: 'organization_registry',
      })

      if (orgEmail) handledEmails.add(orgEmail)
      if (orgPhone) handledPhones.add(orgPhone)
    })

    // Compute aggregated stats
    const stats = {
      total_users: allProfiles.length,
      total_owners: allProfiles.filter((p) => p.user_type === 'owner').length,
      total_tenants: allProfiles.filter((p) => p.user_type === 'tenant').length,
      total_staff: allProfiles.filter((p) => p.user_type === 'staff').length,
      total_admins: allProfiles.filter((p) => p.user_type === 'admin').length,
      active_stays: allProfiles.filter((p) => p.status === 'active').length,
    }

    // Apply filtering if provided in query params
    let filtered = allProfiles
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter((p) =>
        p.user_type === roleFilter || p.role === roleFilter
      )
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.full_name?.toLowerCase().includes(searchQuery) ||
        p.email?.toLowerCase().includes(searchQuery) ||
        p.phone?.includes(searchQuery) ||
        p.organization_name?.toLowerCase().includes(searchQuery) ||
        p.property_name?.toLowerCase().includes(searchQuery) ||
        p.registration_number?.toLowerCase().includes(searchQuery) ||
        p.room_number?.toLowerCase().includes(searchQuery)
      )
    }

    return NextResponse.json({
      success: true,
      users: filtered,
      stats,
      total: allProfiles.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch platform users' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users
 * Create a new user with password and assign role & organization
 * Super Admin only
 */
export async function POST(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request)
  if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })
  try {
    const body = await request.json()
    const { email, password, full_name, role = 'owner', organization_id, phone } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    if (isProtectedSuperAdminIdentity({ email: cleanEmail, phone })) {
      return NextResponse.json(
        { error: 'Security Protection: Cannot create or overwrite protected Super Admin identities through this endpoint.' },
        { status: 403 }
      )
    }

    const supabase = await createServiceClient()

    // 1. Create in Supabase Auth with temporary password flag
    let userId: string | null = null
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        must_change_password: true,
        is_temporary_password: true,
      },
    })

    if (!authError && authUser?.user) {
      userId = authUser.user.id
    } else {
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const found = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === cleanEmail)
      if (found && found.id) {
        userId = found.id
        await supabase.auth.admin.updateUserById(found.id, {
          password,
          user_metadata: {
            full_name,
            role,
            must_change_password: true,
            is_temporary_password: true,
          },
        })
      }
    }

    // 2. Save in database users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId || undefined,
        email: cleanEmail,
        full_name: full_name || cleanEmail.split('@')[0],
        role,
        organization_id: organization_id || null,
        phone: phone || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' })
      .select('*, organizations(name)')
      .single()

    if (profileError && !profile) {
      throw profileError
    }

    return NextResponse.json({
      success: true,
      message: `User ${cleanEmail} created successfully with role ${role}.`,
      user: profile || { email: cleanEmail, role, full_name },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create user' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/users
 * Update user / resident / owner profile in Supabase
 * Super Admin only
 */
export async function PUT(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request)
  if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

  try {
    const body = await request.json()
    const {
      id,
      user_type,
      full_name,
      email,
      phone,
      alternate_phone,
      is_active,
      status,
      role,
      organization_id,
      organization_name,
      resident_id,
      monthly_rent_paise,
      permanent_address,
      permanent_city,
      permanent_state,
      permanent_pincode,
      emergency_name,
      emergency_phone,
      emergency_relation,
      id_type,
      id_number,
      gender,
      date_of_birth,
    } = body

    if (!id && !resident_id) {
      return NextResponse.json({ error: 'User ID or Resident ID is required.' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const cleanEmail = email ? email.toLowerCase().trim() : undefined
    const cleanPhone = phone ? phone.replace(/\D/g, '') : undefined
    const cleanAltPhone = alternate_phone ? alternate_phone.replace(/\D/g, '') : undefined

    if (
      id !== '7d66235b-290c-4c73-9f43-abb9711339db' &&
      id !== 'e4cd9eff-2a5e-4249-9094-e1ae92e1b0e7' &&
      (isProtectedSuperAdminIdentity({ email: cleanEmail, phone: cleanPhone }) ||
       (cleanAltPhone && isProtectedSuperAdminIdentity({ phone: cleanAltPhone })))
    ) {
      return NextResponse.json(
        { error: 'Security Protection: Cannot reassign phone or email to a protected Super Admin identity.' },
        { status: 403 }
      )
    }

    let updatedUser = null
    let updatedResident = null

    // 1. Update in users table if user record exists
    if (id) {
      const userUpdates: any = {
        updated_at: new Date().toISOString(),
      }
      if (full_name !== undefined) userUpdates.full_name = full_name.trim()
      if (cleanEmail !== undefined && cleanEmail) userUpdates.email = cleanEmail
      if (cleanPhone !== undefined) userUpdates.phone = cleanPhone
      if (is_active !== undefined) userUpdates.is_active = Boolean(is_active)
      if (role !== undefined) userUpdates.role = role

      const { data: uData, error: uErr } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', id)
        .select()
        .maybeSingle()

      if (!uErr && uData) {
        updatedUser = uData
      }

      // 2. Update Supabase Auth if user exists in auth
      try {
        const authUpdates: any = {}
        if (cleanEmail) authUpdates.email = cleanEmail
        if (full_name) {
          authUpdates.user_metadata = { full_name: full_name.trim() }
        }
        if (cleanPhone) authUpdates.phone = cleanPhone

        await supabase.auth.admin.updateUserById(id, authUpdates)
      } catch (authErr) {
        console.warn('Auth user sync warning (non-fatal):', authErr)
      }
    }

    // 3. Update resident record if resident_id exists or matches
    const targetResidentId = resident_id || (user_type === 'tenant' ? id : null)
    if (targetResidentId) {
      const resUpdates: any = {
        updated_at: new Date().toISOString(),
      }
      if (full_name !== undefined) resUpdates.full_name = full_name.trim()
      if (cleanPhone !== undefined) resUpdates.phone = cleanPhone
      if (cleanAltPhone !== undefined) resUpdates.alternate_phone = cleanAltPhone
      if (cleanEmail !== undefined && cleanEmail) resUpdates.email = cleanEmail
      if (status !== undefined) resUpdates.status = status
      else if (is_active !== undefined) resUpdates.status = is_active ? 'active' : 'checked_out'
      if (permanent_address !== undefined) resUpdates.permanent_address = permanent_address
      if (permanent_city !== undefined) resUpdates.permanent_city = permanent_city
      if (permanent_state !== undefined) resUpdates.permanent_state = permanent_state
      if (permanent_pincode !== undefined) resUpdates.permanent_pincode = permanent_pincode
      if (emergency_name !== undefined) resUpdates.emergency_name = emergency_name
      if (emergency_phone !== undefined) resUpdates.emergency_phone = emergency_phone
      if (emergency_relation !== undefined) resUpdates.emergency_relation = emergency_relation
      if (id_type !== undefined) resUpdates.id_type = id_type
      if (id_number !== undefined) resUpdates.id_number = id_number
      if (gender !== undefined) resUpdates.gender = gender
      if (date_of_birth !== undefined) resUpdates.date_of_birth = date_of_birth

      const { data: rData, error: rErr } = await supabase
        .from('residents')
        .update(resUpdates)
        .eq('id', targetResidentId)
        .select()
        .maybeSingle()

      if (!rErr && rData) {
        updatedResident = rData
      }

      // Update active assignment rent if specified
      if (monthly_rent_paise !== undefined && monthly_rent_paise !== null) {
        await supabase
          .from('resident_assignments')
          .update({
            monthly_rent_paise: Number(monthly_rent_paise),
            updated_at: new Date().toISOString(),
          })
          .eq('resident_id', targetResidentId)
          .is('check_out_date', null)
      }
    }

    // 4. Update Organization name if PG Owner
    if (organization_id && organization_name) {
      await supabase
        .from('organizations')
        .update({
          name: organization_name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization_id)
    }

    return NextResponse.json({
      success: true,
      message: `Profile for ${full_name || cleanEmail || 'user'} successfully updated in Supabase.`,
      updatedUser,
      updatedResident,
    })
  } catch (err: any) {
    console.error('Error updating user profile:', err)
    return NextResponse.json({ error: err.message || 'Failed to update user profile' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users
 * Completely delete Owner or Tenant profile from Supabase
 * Super Admin only
 */
export async function DELETE(request: NextRequest) {
  const adminUser = await requireSuperAdmin(request)
  if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

  try {
    const url = new URL(request.url)
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      // Body may be empty if params passed via URL
      body = {
        id: url.searchParams.get('id'),
        user_type: url.searchParams.get('user_type'),
        resident_id: url.searchParams.get('resident_id'),
        organization_id: url.searchParams.get('organization_id'),
        delete_organization: url.searchParams.get('delete_organization') === 'true',
        email: url.searchParams.get('email'),
        phone: url.searchParams.get('phone'),
      }
    }

    const {
      id,
      user_type,
      resident_id,
      organization_id,
      delete_organization = false,
      email,
      phone,
    } = body

    if (!id && !resident_id) {
      return NextResponse.json({ error: 'User ID or Resident ID is required.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // 1. Fetch user to verify safeguard
    let targetUser: any = null
    if (id) {
      const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle()
      targetUser = data
    }

    const targetEmail = (email || targetUser?.email || '').toLowerCase().trim()
    const targetPhone = phone || targetUser?.phone || ''
    const targetRole = targetUser?.role

    // CRITICAL MASTER SAFEGUARD: Never delete master superadmin accounts!
    if (
      isKnownSuperAdmin(targetEmail, targetRole, id, targetPhone) ||
      targetRole === 'superadmin' ||
      SUPER_ADMIN_EMAILS.includes(targetEmail) ||
      id === '7d66235b-290c-4c73-9f43-abb9711339db' ||
      id === 'e4cd9eff-2a5e-4249-9094-e1ae92e1b0e7'
    ) {
      return NextResponse.json(
        { error: 'Security Protection: Master Super Admin accounts cannot be deleted.' },
        { status: 403 }
      )
    }

    // 2. TENANT / RESIDENT DELETION CASCADE
    const targetResidentId = resident_id || (user_type === 'tenant' ? id : null)

    if (targetResidentId) {
      // 2a. Find bed assignments to vacate beds
      const { data: assignments } = await supabase
        .from('resident_assignments')
        .select('id, bed_id')
        .eq('resident_id', targetResidentId)

      const bedIds = (assignments || []).map((a: any) => a.bed_id).filter(Boolean)
      if (bedIds.length > 0) {
        await supabase.from('beds').update({ status: 'available' }).in('id', bedIds)
      }

      // 2b. Clean child foreign-key tables in proper order
      await supabase.from('resident_documents').delete().eq('resident_id', targetResidentId)
      await supabase.from('complaints').delete().eq('resident_id', targetResidentId)

      const { data: deposits } = await supabase.from('deposits').select('id').eq('resident_id', targetResidentId)
      const depositIds = (deposits || []).map((d: any) => d.id)
      if (depositIds.length > 0) {
        await supabase.from('deposit_adjustments').delete().in('deposit_id', depositIds)
      }
      await supabase.from('deposits').delete().eq('resident_id', targetResidentId)

      const { data: payments } = await supabase.from('payments').select('id').eq('resident_id', targetResidentId)
      const paymentIds = (payments || []).map((p: any) => p.id)
      if (paymentIds.length > 0) {
        await supabase.from('payment_allocations').delete().in('payment_id', paymentIds)
      }
      await supabase.from('payments').delete().eq('resident_id', targetResidentId)

      const { data: invoices } = await supabase.from('invoices').select('id').eq('resident_id', targetResidentId)
      const invoiceIds = (invoices || []).map((i: any) => i.id)
      if (invoiceIds.length > 0) {
        await supabase.from('invoice_items').delete().in('invoice_id', invoiceIds)
      }
      await supabase.from('invoices').delete().eq('resident_id', targetResidentId)

      await supabase.from('ledger_entries').delete().eq('resident_id', targetResidentId)
      await supabase.from('resident_assignments').delete().eq('resident_id', targetResidentId)
      await supabase.from('users').update({ resident_id: null }).eq('resident_id', targetResidentId)
      await supabase.from('residents').delete().eq('id', targetResidentId)
    }

    // 3. OWNER / USER CLEANUP & CASCADE
    const targetUserId = id

    if (targetUserId) {
      // Unlink foreign key references to users(id) to avoid foreign key constraints
      await supabase.from('residents').update({ created_by: null }).eq('created_by', targetUserId)
      await supabase.from('resident_assignments').update({ authorized_by: null }).eq('authorized_by', targetUserId)
      await supabase.from('invoices').update({ created_by: null }).eq('created_by', targetUserId)
      await supabase.from('payments').update({ received_by: null }).eq('received_by', targetUserId)
      await supabase.from('expenses').update({ recorded_by: null }).eq('recorded_by', targetUserId)

      // If Owner and delete_organization is requested
      const targetOrgId = organization_id || targetUser?.organization_id
      if (delete_organization && targetOrgId) {
        // Deep purge organization data
        await supabase.from('ledger_entries').delete().eq('organization_id', targetOrgId)
        const { data: orgPayments } = await supabase.from('payments').select('id').eq('organization_id', targetOrgId)
        const orgPayIds = (orgPayments || []).map((p: any) => p.id)
        if (orgPayIds.length > 0) {
          await supabase.from('payment_allocations').delete().in('payment_id', orgPayIds)
        }
        await supabase.from('payments').delete().eq('organization_id', targetOrgId)

        const { data: orgInvoices } = await supabase.from('invoices').select('id').eq('organization_id', targetOrgId)
        const orgInvIds = (orgInvoices || []).map((i: any) => i.id)
        if (orgInvIds.length > 0) {
          await supabase.from('invoice_items').delete().in('invoice_id', orgInvIds)
        }
        await supabase.from('invoices').delete().eq('organization_id', targetOrgId)

        await supabase.from('deposit_adjustments').delete().eq('organization_id', targetOrgId)
        await supabase.from('deposits').delete().eq('organization_id', targetOrgId)
        await supabase.from('resident_documents').delete().eq('organization_id', targetOrgId)
        await supabase.from('complaints').delete().eq('organization_id', targetOrgId)
        await supabase.from('message_logs').delete().eq('organization_id', targetOrgId)
        await supabase.from('electricity_readings').delete().eq('organization_id', targetOrgId)
        await supabase.from('expenses').delete().eq('organization_id', targetOrgId)
        await supabase.from('resident_assignments').delete().eq('organization_id', targetOrgId)
        await supabase.from('residents').delete().eq('organization_id', targetOrgId)
        await supabase.from('electricity_meters').delete().eq('organization_id', targetOrgId)
        await supabase.from('beds').delete().eq('organization_id', targetOrgId)
        await supabase.from('rooms').delete().eq('organization_id', targetOrgId)
        await supabase.from('floors').delete().eq('organization_id', targetOrgId)
        await supabase.from('buildings').delete().eq('organization_id', targetOrgId)
        await supabase.from('properties').delete().eq('organization_id', targetOrgId)
        await supabase.from('organization_sequences').delete().eq('organization_id', targetOrgId)
        await supabase.from('invoice_sequences').delete().eq('organization_id', targetOrgId)
        await supabase.from('payment_sequences').delete().eq('organization_id', targetOrgId)
        await supabase.from('organizations').delete().eq('id', targetOrgId)
      } else if (targetOrgId) {
        // Just unlink organization ownership
        await supabase.from('organizations').update({ owner_user_id: null }).eq('owner_user_id', targetUserId)
      }

      // Delete from users table
      await supabase.from('users').delete().eq('id', targetUserId)

      // Delete from Supabase Auth
      try {
        await supabase.auth.admin.deleteUser(targetUserId)
      } catch (authErr) {
        console.warn('Supabase Auth user delete error (user may not exist in auth.users):', authErr)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Profile has been completely deleted from Supabase.`,
    })
  } catch (err: any) {
    console.error('Error deleting user:', err)
    return NextResponse.json({ error: err.message || 'Failed to delete user' }, { status: 500 })
  }
}
