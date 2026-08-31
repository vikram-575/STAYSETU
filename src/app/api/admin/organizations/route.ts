import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rupeesToPaise } from '@/lib/money'

import { isSuperAdminFromRequest } from '@/lib/admin-auth'

/**
 * Shared helper: verify request is from a superadmin
 */
async function requireSuperAdmin(request: NextRequest) {
  if (isSuperAdminFromRequest(request)) {
    return { role: 'superadmin' }
  }
  try {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const service = await createServiceClient()
    const { data: profile } = await service.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'superadmin') return null
    return user
  } catch {
    return null
  }
}

/**
 * GET /api/admin/organizations
 * Lists all onboarded PGs with capacity and financial metrics
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()

    // Fetch all organizations
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (orgError) throw orgError

    // Fetch all users with role 'owner'
    const { data: owners } = await supabase
      .from('users')
      .select('id, organization_id, full_name, email, phone, role, last_login_at')
      .eq('role', 'owner')

    // Fetch all beds
    const { data: allBeds } = await supabase
      .from('beds')
      .select('id, organization_id, status')

    // Fetch all active residents
    const { data: allResidents } = await supabase
      .from('residents')
      .select('id, organization_id, status')
      .eq('status', 'active')

    // Fetch all invoices
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('organization_id, total_paise, paid_paise, balance_paise, status')
      .not('status', 'in', '(cancelled,draft)')

    // Fetch property counts
    const { data: allProps } = await supabase
      .from('properties')
      .select('id, organization_id')

    const result = (orgs || []).map((org) => {
      const owner = owners?.find((o) => o.organization_id === org.id)
      const orgBeds = allBeds?.filter((b) => b.organization_id === org.id) || []
      const orgResidents = allResidents?.filter((r) => r.organization_id === org.id) || []
      const orgInvoices = allInvoices?.filter((i) => i.organization_id === org.id) || []
      const orgProps = allProps?.filter((p) => p.organization_id === org.id) || []

      const totalBeds = orgBeds.length
      const occupiedBeds = orgBeds.filter((b) => b.status === 'occupied').length
      const totalCollected = orgInvoices.reduce((s, i) => s + (i.paid_paise || 0), 0)
      const totalOutstanding = orgInvoices.reduce((s, i) => s + Math.max(0, i.balance_paise || 0), 0)

      const settings = org.settings || {}
      const plan = settings.plan || 'starter'
      const subscriptionStatus = settings.subscription_status || 'active'

      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        phone: org.phone,
        email: org.email,
        city: org.city,
        address: org.address,
        gst_enabled: org.gst_enabled,
        gstin: org.gstin,
        created_at: org.created_at,
        plan,
        subscription_status: subscriptionStatus,
        subscription_valid_until: settings.subscription_valid_until || null,
        owner: owner ? {
          name: owner.full_name,
          email: owner.email,
          phone: owner.phone,
          last_login_at: owner.last_login_at,
        } : null,
        properties_count: orgProps.length,
        total_beds: totalBeds,
        occupied_beds: occupiedBeds,
        occupancy_rate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        active_residents_count: orgResidents.length,
        total_collected_paise: totalCollected,
        total_outstanding_paise: totalOutstanding,
      }
    })

    return NextResponse.json({ success: true, organizations: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch organizations' }, { status: 500 })
  }
}

/**
 * POST /api/admin/organizations
 * Automated 1-Click Onboard complete PG business
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const body = await request.json()
    const {
      org_name,
      owner_name,
      owner_email,
      owner_phone,
      property_name,
      city,
      address,
      gst_enabled,
      gstin,
      plan = 'per_bed',
      subscription_status = 'active',
      num_buildings = 1,
      floors_per_building = 3,
      rooms_per_floor = 4,
      beds_per_room = 2,
      base_rent_rupees = 6000,
    } = body

    if (!org_name || !property_name) {
      return NextResponse.json({ error: 'Organization name and property name are required.' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const slug = org_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Math.random().toString(36).substring(2, 6)

    const initialSettings = {
      plan,
      subscription_status,
      subscription_valid_until: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
      upi_id: `${slug}@upi`,
      currency: 'INR',
    }

    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        name: org_name,
        slug,
        phone: owner_phone || null,
        email: owner_email || null,
        city: city || null,
        address: address || null,
        gst_enabled: !!gst_enabled,
        gstin: gstin || null,
        settings: initialSettings,
      })
      .select()
      .single()

    if (orgErr || !org) throw new Error(orgErr?.message || 'Failed to create organization')

    const userEmail = (owner_email || `${slug}@pgsetu.com`).toLowerCase().trim()
    await supabase
      .from('users')
      .insert({
        organization_id: org.id,
        email: userEmail,
        full_name: owner_name || 'PG Owner',
        phone: owner_phone || null,
        role: 'owner',
      })
      .select()
      .single()

    await supabase.from('organization_sequences').insert({ organization_id: org.id, last_seq: 0 })
    await supabase.from('invoice_sequences').insert({ organization_id: org.id, last_seq: 0 })
    await supabase.from('payment_sequences').insert({ organization_id: org.id, last_seq: 0 })

    const { data: property, error: propErr } = await supabase
      .from('properties')
      .insert({
        organization_id: org.id,
        name: property_name,
        city: city || null,
        address: address || null,
        phone: owner_phone || null,
      })
      .select()
      .single()

    if (propErr || !property) throw new Error(propErr?.message || 'Failed to create property')

    const baseRentPaise = rupeesToPaise(Number(base_rent_rupees) || 6000)
    let totalRoomsCreated = 0
    let totalBedsCreated = 0
    const bedLetterLabels = ['A', 'B', 'C', 'D', 'E', 'F']

    for (let b = 1; b <= Math.min(Number(num_buildings) || 1, 5); b++) {
      const bldgName = num_buildings > 1 ? `Building ${b}` : 'Main Building'
      const { data: building } = await supabase
        .from('buildings')
        .insert({
          organization_id: org.id,
          property_id: property.id,
          name: bldgName,
          total_floors: Number(floors_per_building) || 3,
        })
        .select()
        .single()

      if (building) {
        for (let f = 0; f < (Number(floors_per_building) || 3); f++) {
          const floorName = f === 0 ? 'Ground Floor' : `${f}${f === 1 ? 'st' : f === 2 ? 'nd' : 'rd'} Floor`
          const { data: floor } = await supabase
            .from('floors')
            .insert({
              organization_id: org.id,
              building_id: building.id,
              floor_number: f,
              name: floorName,
            })
            .select()
            .single()

          if (floor) {
            for (let r = 1; r <= (Number(rooms_per_floor) || 4); r++) {
              const roomNumber = `${f}${String(r).padStart(2, '0')}`
              const sharingType = beds_per_room === 1 ? 'single' : beds_per_room === 2 ? 'double' : beds_per_room === 3 ? 'triple' : 'four'
              const { data: room } = await supabase
                .from('rooms')
                .insert({
                  organization_id: org.id,
                  floor_id: floor.id,
                  room_number: roomNumber,
                  name: `Room ${roomNumber}`,
                  room_type: sharingType,
                  base_rent_paise: baseRentPaise,
                  capacity: Number(beds_per_room) || 2,
                })
                .select()
                .single()

              if (room) {
                totalRoomsCreated++

                const { data: meter } = await supabase
                  .from('electricity_meters')
                  .insert({
                    organization_id: org.id,
                    property_id: property.id,
                    room_id: room.id,
                    meter_number: `MTR-${roomNumber}`,
                    meter_type: 'sub',
                    allocation_method: 'equal_split',
                  })
                  .select()
                  .single()

                if (meter) {
                  await supabase.from('electricity_readings').insert({
                    organization_id: org.id,
                    meter_id: meter.id,
                    reading_date: new Date().toISOString().split('T')[0],
                    previous_reading: 0,
                    current_reading: 0,
                    rate_per_unit_paise: 900,
                    period_month: new Date().getMonth() + 1,
                    period_year: new Date().getFullYear(),
                  })
                }

                for (let bedIdx = 0; bedIdx < (Number(beds_per_room) || 2); bedIdx++) {
                  const label = bedLetterLabels[bedIdx] || String(bedIdx + 1)
                  await supabase.from('beds').insert({
                    organization_id: org.id,
                    room_id: room.id,
                    bed_label: label,
                    status: 'available',
                    base_rent_paise: baseRentPaise,
                  })
                  totalBedsCreated++
                }
              }
            }
          }
        }
      }
    }

    try {
      await supabase.rpc('seed_default_templates', { p_org_id: org.id })
    } catch {
      // ignore if RPC not present
    }

    return NextResponse.json({
      success: true,
      org_id: org.id,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan,
        properties_created: 1,
        rooms_created: totalRoomsCreated,
        beds_created: totalBedsCreated,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to onboard PG organization' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/organizations
 * Quick update PG status, subscription expiry, plan, or bank/UPI settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const body = await request.json()
    const { id, name, phone, city, address, plan, status, valid_until, upi_id, gst_enabled, gstin } = body

    if (!id) {
      return NextResponse.json({ error: 'Organization ID is required.' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const { data: existingOrg, error: fetchErr } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !existingOrg) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
    }

    const currentSettings = existingOrg.settings || {}
    const updatedSettings = {
      ...currentSettings,
      plan: plan || currentSettings.plan || 'per_bed',
      subscription_status: status || currentSettings.subscription_status || 'active',
      subscription_valid_until: valid_until || currentSettings.subscription_valid_until,
      upi_id: upi_id || currentSettings.upi_id,
    }

    const updatePayload: any = {
      settings: updatedSettings,
    }

    if (name) updatePayload.name = name.trim()
    if (phone !== undefined) updatePayload.phone = phone?.trim() || null
    if (city !== undefined) updatePayload.city = city?.trim() || null
    if (address !== undefined) updatePayload.address = address?.trim() || null
    if (gst_enabled !== undefined) updatePayload.gst_enabled = Boolean(gst_enabled)
    if (gstin !== undefined) updatePayload.gstin = gstin?.trim() || null

    const { data: updated, error: updateErr } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) throw updateErr

    return NextResponse.json({
      success: true,
      message: `Organization "${updated.name}" updated successfully.`,
      organization: updated,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update organization' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/organizations
 * Completely removes an organization and all its data
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('id')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // 1. Delete dependent transactional records
    await supabase.from('ledger_entries').delete().eq('organization_id', orgId)
    await supabase.from('payments').delete().eq('organization_id', orgId)
    await supabase.from('invoices').delete().eq('organization_id', orgId)
    await supabase.from('electricity_readings').delete().eq('organization_id', orgId)
    await supabase.from('electricity_meters').delete().eq('organization_id', orgId)
    await supabase.from('complaints').delete().eq('organization_id', orgId)
    await supabase.from('message_logs').delete().eq('organization_id', orgId)
    await supabase.from('expenses').delete().eq('organization_id', orgId)
    await supabase.from('beds').delete().eq('organization_id', orgId)
    await supabase.from('rooms').delete().eq('organization_id', orgId)
    await supabase.from('floors').delete().eq('organization_id', orgId)
    await supabase.from('buildings').delete().eq('organization_id', orgId)
    await supabase.from('properties').delete().eq('organization_id', orgId)
    await supabase.from('residents').delete().eq('organization_id', orgId)
    await supabase.from('users').delete().eq('organization_id', orgId)
    await supabase.from('organization_sequences').delete().eq('organization_id', orgId)
    await supabase.from('invoice_sequences').delete().eq('organization_id', orgId)
    await supabase.from('payment_sequences').delete().eq('organization_id', orgId)

    // 2. Delete organization record
    const { error } = await supabase.from('organizations').delete().eq('id', orgId)
    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Organization and all associated records permanently removed.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete organization' }, { status: 500 })
  }
}
