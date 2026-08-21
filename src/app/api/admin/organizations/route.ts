import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rupeesToPaise } from '@/lib/money'

/**
 * GET /api/admin/organizations
 * Lists all onboarded PGs with capacity and financial metrics
 */
export async function GET() {
  try {
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

    const result = orgs.map((org) => {
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
      plan = 'starter',
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

    // 1. Create Organization
    const slug = org_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Math.random().toString(36).substring(2, 6)

    const initialSettings = {
      plan,
      subscription_status,
      subscription_valid_until: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0], // 1 year
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

    // 2. Create Owner User Profile
    const userEmail = (owner_email || `${slug}@pgsetu.com`).toLowerCase().trim()
    const { data: ownerUser } = await supabase
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

    // 3. Initialize sequences
    await supabase.from('organization_sequences').insert({ organization_id: org.id, last_seq: 0 })
    await supabase.from('invoice_sequences').insert({ organization_id: org.id, last_seq: 0 })
    await supabase.from('payment_sequences').insert({ organization_id: org.id, last_seq: 0 })

    // 4. Create Property
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

    // 5. Automated Generation of Buildings, Floors, Rooms, and Beds
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
              const roomNumber = `${f}${String(r).padStart(2, '0')}` // e.g. 001, 002, 101, 102, 201
              const sharingType = beds_per_room === 1 ? 'single' : beds_per_room === 2 ? 'double' : beds_per_room === 3 ? 'triple' : 'four'
              const { data: room } = await supabase
                .from('rooms')
                .insert({
                  organization_id: org.id,
                  floor_id: floor.id,
                  room_number: roomNumber,
                  name: `Room ${roomNumber}`,
                  sharing_type: sharingType,
                  base_rent_paise: baseRentPaise,
                  total_beds: Number(beds_per_room) || 2,
                })
                .select()
                .single()

              if (room) {
                totalRoomsCreated++

                // Sub-meter for room
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

                // Initial 0 reading
                if (meter) {
                  await supabase.from('electricity_readings').insert({
                    organization_id: org.id,
                    meter_id: meter.id,
                    reading_date: new Date().toISOString().split('T')[0],
                    previous_reading: 0,
                    current_reading: 0,
                    rate_per_unit_paise: 900, // ₹9/unit
                    period_month: new Date().getMonth() + 1,
                    period_year: new Date().getFullYear(),
                  })
                }

                // Beds
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

    // 6. Seed message templates
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
