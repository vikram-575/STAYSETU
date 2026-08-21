import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rupeesToPaise } from '@/lib/money'

/**
 * POST /api/onboarding
 * Production Onboarding: Creates organization, owner profile, property, building, floors, rooms & beds
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized. Please sign in or register.' }, { status: 401 })

    const body = await request.json()
    const {
      org_name,
      property_name,
      property_city,
      property_address,
      phone,
      num_floors = 2,
      rooms_per_floor = 4,
      beds_per_room = 2,
      default_rent_rupees = 6000,
    } = body

    if (!org_name || !property_name) {
      return NextResponse.json({ error: 'PG organization name and property name are required.' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // 1. Create Organization
    const slug = org_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Math.random().toString(36).substring(2, 6)

    const initialSettings = {
      plan: 'per_bed',
      rate_per_bed: 10,
      subscription_status: 'active',
      subscription_valid_until: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
      upi_id: `${slug}@upi`,
      currency: 'INR',
    }

    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .insert({
        name: org_name,
        slug,
        owner_user_id: user.id,
        phone: phone || null,
        email: user.email || null,
        city: property_city || null,
        address: property_address || null,
        settings: initialSettings,
      })
      .select()
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: orgError?.message || 'Failed to create organization' }, { status: 500 })
    }

    // 2. Create User Profile
    await serviceClient.from('users').upsert({
      id: user.id,
      organization_id: org.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.email!.split('@')[0],
      phone: phone || null,
      role: 'owner',
      is_active: true,
    })

    // 3. Initialize Sequences
    await serviceClient.from('organization_sequences').upsert({ organization_id: org.id, last_seq: 0 })
    await serviceClient.from('invoice_sequences').upsert({ organization_id: org.id, last_seq: 0 })
    await serviceClient.from('payment_sequences').upsert({ organization_id: org.id, last_seq: 0 })

    // 4. Create Property
    const { data: property, error: propError } = await serviceClient
      .from('properties')
      .insert({
        organization_id: org.id,
        name: property_name,
        address: property_address || null,
        city: property_city || null,
        phone: phone || null,
      })
      .select()
      .single()

    if (propError || !property) {
      return NextResponse.json({ error: propError?.message || 'Failed to create property' }, { status: 500 })
    }

    // 5. Create Building
    const { data: building } = await serviceClient
      .from('buildings')
      .insert({
        organization_id: org.id,
        property_id: property.id,
        name: 'Main Building',
        total_floors: Number(num_floors) || 2,
      })
      .select()
      .single()

    // 6. Generate Floors, Rooms, Beds & Sub-Meters
    const baseRentPaise = rupeesToPaise(Number(default_rent_rupees) || 6000)
    const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F']

    if (building) {
      for (let f = 0; f < (Number(num_floors) || 2); f++) {
        const floorName = f === 0 ? 'Ground Floor' : `${f}${f === 1 ? 'st' : f === 2 ? 'nd' : 'rd'} Floor`
        const { data: floor } = await serviceClient
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
            const roomNo = `${f}${String(r).padStart(2, '0')}` // e.g. 001, 002, 101, 102
            const sharingType = beds_per_room === 1 ? 'single' : beds_per_room === 2 ? 'double' : beds_per_room === 3 ? 'triple' : 'four'
            
            const { data: room } = await serviceClient
              .from('rooms')
              .insert({
                organization_id: org.id,
                floor_id: floor.id,
                room_number: roomNo,
                name: `Room ${roomNo}`,
                sharing_type: sharingType,
                base_rent_paise: baseRentPaise,
                total_beds: Number(beds_per_room) || 2,
              })
              .select()
              .single()

            if (room) {
              // Sub-Meter for room
              const { data: meter } = await serviceClient
                .from('electricity_meters')
                .insert({
                  organization_id: org.id,
                  property_id: property.id,
                  room_id: room.id,
                  meter_number: `MTR-${roomNo}`,
                  meter_type: 'sub',
                  allocation_method: 'equal_split',
                })
                .select()
                .single()

              if (meter) {
                await serviceClient.from('electricity_readings').insert({
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

              // Beds
              for (let bIdx = 0; bIdx < (Number(beds_per_room) || 2); bIdx++) {
                await serviceClient.from('beds').insert({
                  organization_id: org.id,
                  room_id: room.id,
                  bed_label: bedLabels[bIdx] || String(bIdx + 1),
                  status: 'available',
                  base_rent_paise: baseRentPaise,
                })
              }
            }
          }
        }
      }
    }

    // 7. Seed Message Templates
    try {
      await serviceClient.rpc('seed_default_templates', { p_org_id: org.id })
    } catch {}

    return NextResponse.json({ success: true, org_id: org.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Onboarding failed' }, { status: 500 })
  }
}
