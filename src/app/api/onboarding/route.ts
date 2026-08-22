import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rupeesToPaise } from '@/lib/money'
import { cookies } from 'next/headers'

/**
 * POST /api/onboarding
 * Unified Onboarding: Creates organization, property, building, floors, rooms, beds & meters in Supabase
 * (Firebase sync removed — Supabase is single source of truth)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authEmail = cookieStore.get('auth_email')?.value

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
    const slug = org_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Math.random().toString(36).substring(2, 6)

    const initialSettings = {
      plan: 'per_bed',
      rate_per_bed: 10,
      subscription_status: 'active',
      subscription_valid_until: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
      upi_id: `${slug}@upi`,
      currency: 'INR',
    }

    // 1. Create Organization
    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .insert({
        name: org_name,
        slug,
        phone: phone || null,
        email: authEmail || null,
        city: property_city || null,
        address: property_address || null,
        settings: initialSettings,
      })
      .select()
      .single()

    if (orgError || !org) {
      throw new Error(orgError?.message || 'Failed to create organization')
    }

    const orgId = org.id

    // 2. Link user if email present
    if (authEmail) {
      await serviceClient.from('users').update({
        organization_id: orgId,
        phone: phone || null,
      }).eq('email', authEmail)
    }

    // 3. Create Property
    const { data: property } = await serviceClient
      .from('properties')
      .insert({
        organization_id: orgId,
        name: property_name,
        address: property_address || null,
        city: property_city || null,
        phone: phone || null,
      })
      .select()
      .single()

    const propId = property?.id

    // 4. Create Building
    const { data: building } = await serviceClient
      .from('buildings')
      .insert({
        organization_id: orgId,
        property_id: propId,
        name: 'Main Building',
        total_floors: Number(num_floors) || 2,
      })
      .select()
      .single()

    const bldgId = building?.id

    // 5. Generate Floors, Rooms, Beds & Sub-Meters
    const baseRentPaise = rupeesToPaise(Number(default_rent_rupees) || 6000)
    const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F']

    if (bldgId) {
      for (let f = 0; f < (Number(num_floors) || 2); f++) {
        const floorName = f === 0 ? 'Ground Floor' : `${f}${f === 1 ? 'st' : f === 2 ? 'nd' : 'rd'} Floor`
        const { data: floor } = await serviceClient
          .from('floors')
          .insert({
            organization_id: orgId,
            building_id: bldgId,
            floor_number: f,
            name: floorName,
          })
          .select()
          .single()

        if (floor) {
          for (let r = 1; r <= (Number(rooms_per_floor) || 4); r++) {
            const roomNo = `${f}${String(r).padStart(2, '0')}`
            const sharingType = beds_per_room === 1 ? 'single' : beds_per_room === 2 ? 'double' : beds_per_room === 3 ? 'triple' : 'four'

            const { data: room } = await serviceClient
              .from('rooms')
              .insert({
                organization_id: orgId,
                floor_id: floor.id,
                room_number: roomNo,
                name: `Room ${roomNo}`,
                room_type: sharingType,
                base_rent_paise: baseRentPaise,
                capacity: Number(beds_per_room) || 2,
              })
              .select()
              .single()

            if (room) {
              const { data: meter } = await serviceClient
                .from('electricity_meters')
                .insert({
                  organization_id: orgId,
                  property_id: propId,
                  room_id: room.id,
                  meter_number: `MTR-${roomNo}`,
                  meter_type: 'sub',
                  allocation_method: 'equal_split',
                })
                .select()
                .single()

              if (meter) {
                await serviceClient.from('electricity_readings').insert({
                  organization_id: orgId,
                  meter_id: meter.id,
                  reading_date: new Date().toISOString().split('T')[0],
                  previous_reading: 0,
                  current_reading: 0,
                  rate_per_unit_paise: 900,
                  period_month: new Date().getMonth() + 1,
                  period_year: new Date().getFullYear(),
                })
              }

              for (let bIdx = 0; bIdx < (Number(beds_per_room) || 2); bIdx++) {
                const bedLabel = bedLabels[bIdx] || String(bIdx + 1)
                await serviceClient
                  .from('beds')
                  .insert({
                    organization_id: orgId,
                    room_id: room.id,
                    bed_label: bedLabel,
                    status: 'available',
                    base_rent_paise: baseRentPaise,
                  })
                  .select()
                  .single()
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, org_id: orgId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Onboarding failed' }, { status: 500 })
  }
}
