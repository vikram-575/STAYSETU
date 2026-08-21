import { NextResponse, type NextRequest } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { COLLECTIONS, createDocument } from '@/lib/firebase/firestore'
import { createServiceClient } from '@/lib/supabase/server'
import { rupeesToPaise } from '@/lib/money'
import { cookies } from 'next/headers'

/**
 * POST /api/onboarding
 * Production Onboarding: Creates organization, owner profile, property, building, floors, rooms & beds in Firestore & Database
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const firebaseUserId = cookieStore.get('firebase_user_id')?.value

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

    const slug = org_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Math.random().toString(36).substring(2, 6)

    const initialSettings = {
      plan: 'per_bed',
      rate_per_bed: 10,
      subscription_status: 'active',
      subscription_valid_until: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
      upi_id: `${slug}@upi`,
      currency: 'INR',
    }

    // 1. Create Organization in Firestore
    const orgDoc = await adminDb.collection(COLLECTIONS.ORGANIZATIONS).add({
      name: org_name,
      slug,
      phone: phone || null,
      city: property_city || null,
      address: property_address || null,
      settings: initialSettings,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    const orgId = orgDoc.id

    // 2. Link or create User Profile in Firestore
    if (firebaseUserId) {
      await adminDb.collection(COLLECTIONS.USERS).doc(firebaseUserId).set({
        organization_id: orgId,
        full_name: 'PG Owner',
        phone: phone || null,
        role: 'owner',
        is_active: true,
        created_at: new Date().toISOString(),
      }, { merge: true })
    }

    // 3. Create Property in Firestore
    const propDoc = await adminDb.collection(COLLECTIONS.PROPERTIES).add({
      organization_id: orgId,
      name: property_name,
      address: property_address || null,
      city: property_city || null,
      phone: phone || null,
      created_at: new Date().toISOString(),
    })
    const propId = propDoc.id

    // 4. Create Building in Firestore
    const bldgDoc = await adminDb.collection(COLLECTIONS.BUILDINGS).add({
      organization_id: orgId,
      property_id: propId,
      name: 'Main Building',
      total_floors: Number(num_floors) || 2,
      created_at: new Date().toISOString(),
    })
    const bldgId = bldgDoc.id

    // 5. Generate Floors, Rooms, Beds & Sub-Meters in Firestore
    const baseRentPaise = rupeesToPaise(Number(default_rent_rupees) || 6000)
    const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F']

    for (let f = 0; f < (Number(num_floors) || 2); f++) {
      const floorName = f === 0 ? 'Ground Floor' : `${f}${f === 1 ? 'st' : f === 2 ? 'nd' : 'rd'} Floor`
      const floorDoc = await adminDb.collection(COLLECTIONS.FLOORS).add({
        organization_id: orgId,
        building_id: bldgId,
        floor_number: f,
        name: floorName,
        created_at: new Date().toISOString(),
      })
      const floorId = floorDoc.id

      for (let r = 1; r <= (Number(rooms_per_floor) || 4); r++) {
        const roomNo = `${f}${String(r).padStart(2, '0')}`
        const sharingType = beds_per_room === 1 ? 'single' : beds_per_room === 2 ? 'double' : beds_per_room === 3 ? 'triple' : 'four'

        const roomDoc = await adminDb.collection(COLLECTIONS.ROOMS).add({
          organization_id: orgId,
          floor_id: floorId,
          room_number: roomNo,
          name: `Room ${roomNo}`,
          sharing_type: sharingType,
          base_rent_paise: baseRentPaise,
          total_beds: Number(beds_per_room) || 2,
          created_at: new Date().toISOString(),
        })
        const roomId = roomDoc.id

        // Create Sub-meter
        const meterDoc = await adminDb.collection(COLLECTIONS.ELECTRICITY_METERS).add({
          organization_id: orgId,
          property_id: propId,
          room_id: roomId,
          meter_number: `MTR-${roomNo}`,
          meter_type: 'sub',
          allocation_method: 'equal_split',
          created_at: new Date().toISOString(),
        })

        await adminDb.collection(COLLECTIONS.ELECTRICITY_READINGS).add({
          organization_id: orgId,
          meter_id: meterDoc.id,
          reading_date: new Date().toISOString().split('T')[0],
          previous_reading: 0,
          current_reading: 0,
          rate_per_unit_paise: 900,
          period_month: new Date().getMonth() + 1,
          period_year: new Date().getFullYear(),
          created_at: new Date().toISOString(),
        })

        // Create Beds
        for (let bIdx = 0; bIdx < (Number(beds_per_room) || 2); bIdx++) {
          await adminDb.collection(COLLECTIONS.BEDS).add({
            organization_id: orgId,
            room_id: roomId,
            bed_label: bedLabels[bIdx] || String(bIdx + 1),
            status: 'available',
            base_rent_paise: baseRentPaise,
            created_at: new Date().toISOString(),
          })
        }
      }
    }

    // Also sync to SQL database if connection available for backward-compatibility
    try {
      const serviceClient = await createServiceClient()
      await serviceClient.from('organizations').insert({
        id: orgId.length === 36 ? orgId : undefined,
        name: org_name,
        slug,
        phone: phone || null,
        city: property_city || null,
        address: property_address || null,
        settings: initialSettings,
      })
    } catch {}

    return NextResponse.json({ success: true, org_id: orgId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Onboarding failed' }, { status: 500 })
  }
}
