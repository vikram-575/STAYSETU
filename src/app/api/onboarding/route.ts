import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rupeesToPaise } from '@/lib/money'
import { cookies } from 'next/headers'
import { getAdminSessionFromCookies, SUPER_ADMIN_EMAIL } from '@/lib/admin-auth'

/**
 * Helper to generate a secure 8-digit temporary password
 */
function generate8DigitPassword(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

/**
 * POST /api/onboarding
 * Comprehensive Enterprise PG Onboarding:
 * Creates organization, full property address, building, floors, rooms, beds,
 * electricity sub-meters, bank/UPI settlement settings, generates 8-digit temporary passwords,
 * and provisions staff user accounts.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authEmail = cookieStore.get('auth_email')?.value
    const adminSession = await getAdminSessionFromCookies()

    const body = await request.json()
    const {
      // Step 1: PG Identity & Address
      org_name,
      property_name,
      pg_type = 'coliving',
      address_line1,
      address_line2,
      landmark,
      city,
      state,
      pincode,
      map_link,

      // Step 2: Owner & Contact
      owner_name,
      phone,
      email,
      emergency_phone,
      gst_enabled = false,
      gstin,

      // Step 3: Inventory & Floor Architecture
      num_buildings = 1,
      num_floors = 2,
      rooms_per_floor = 4,
      default_beds_per_room = 2,
      default_rent_rupees = 6500,
      single_rent_rupees = 9000,
      double_rent_rupees = 6500,
      triple_rent_rupees = 5000,
      four_rent_rupees = 4000,
      deposit_policy = 'one_month',
      deposit_fixed_rupees = 5000,
      billing_cycle_day = 1,
      notice_period_days = 30,

      // Step 4: Utility & Electricity
      electricity_billing_type = 'sub_meter',
      rate_per_unit_rupees = 9,
      maintenance_fee_rupees = 0,

      // Step 5: UPI, Autopay & Bank Settlement
      upi_id,
      bank_account_no,
      bank_ifsc,
      bank_account_holder,
      bank_name,
      late_fee_daily_rupees = 50,

      // Step 6: Initial Staff (Optional)
      staff_members = [],
    } = body

    if (!org_name || !property_name) {
      return NextResponse.json(
        { error: 'PG Brand/Organization name and Property name are required.' },
        { status: 400 }
      )
    }

    const serviceClient = await createServiceClient()
    const effectiveEmail = (email || authEmail || (adminSession ? SUPER_ADMIN_EMAIL : `owner_${Date.now()}@pgsetu.com`)).toLowerCase().trim()
    const ownerTemporaryPassword = generate8DigitPassword()

    // Generate unique organization slug
    const slug =
      org_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 30) +
      '-' +
      Math.random().toString(36).substring(2, 6)

    // Construct full address string
    const fullAddressParts = [
      address_line1,
      address_line2,
      landmark ? `Near ${landmark}` : null,
      city,
      state ? `${state} - ${pincode || ''}` : pincode,
    ].filter(Boolean)
    const combinedAddress = fullAddressParts.join(', ')

    // Default rates in paise
    const singleRentPaise = rupeesToPaise(Number(single_rent_rupees) || 9000)
    const doubleRentPaise = rupeesToPaise(Number(double_rent_rupees) || 6500)
    const tripleRentPaise = rupeesToPaise(Number(triple_rent_rupees) || 5000)
    const fourRentPaise = rupeesToPaise(Number(four_rent_rupees) || 4000)
    const defaultRentPaise = rupeesToPaise(Number(default_rent_rupees) || 6500)
    const ratePerUnitPaise = Math.round(Number(rate_per_unit_rupees) * 100) || 900
    const maintenanceFeePaise = rupeesToPaise(Number(maintenance_fee_rupees) || 0)
    const lateFeeDailyPaise = rupeesToPaise(Number(late_fee_daily_rupees) || 50)
    const depositFixedPaise = rupeesToPaise(Number(deposit_fixed_rupees) || 5000)

    const effectiveUpiId = upi_id?.trim() || `${slug}@upi`

    // Rich organization settings JSON
    const organizationSettings = {
      plan: 'per_bed',
      rate_per_bed: 10,
      subscription_status: 'active',
      subscription_valid_until: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
      pg_type,
      currency: 'INR',
      upi_id: effectiveUpiId,
      bank_settlement: {
        account_holder: bank_account_holder?.trim() || owner_name || org_name,
        account_no: bank_account_no?.trim() || null,
        ifsc: bank_ifsc?.trim()?.toUpperCase() || null,
        bank_name: bank_name?.trim() || null,
        upi_id: effectiveUpiId,
      },
      billing: {
        billing_cycle_day: Number(billing_cycle_day) || 1,
        notice_period_days: Number(notice_period_days) || 30,
        late_fee_daily_paise: lateFeeDailyPaise,
        deposit_policy,
        deposit_fixed_paise: depositFixedPaise,
      },
      utilities: {
        electricity_type: electricity_billing_type,
        rate_per_unit_paise: ratePerUnitPaise,
        maintenance_fee_paise: maintenanceFeePaise,
      },
      contacts: {
        emergency_phone: emergency_phone?.trim() || null,
        owner_phone: phone?.trim() || null,
        map_link: map_link?.trim() || null,
      },
    }

    // 1. Create Organization in Supabase
    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .insert({
        name: org_name.trim(),
        slug,
        phone: phone?.trim() || null,
        email: effectiveEmail,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        address: combinedAddress || address_line1 || null,
        gst_enabled: Boolean(gst_enabled),
        gstin: gstin?.trim() || null,
        settings: organizationSettings,
      })
      .select()
      .single()

    if (orgError || !org) {
      throw new Error(orgError?.message || 'Failed to create organization record in database.')
    }

    const orgId = org.id

    // 2. Initialize sequences
    try {
      await serviceClient.from('organization_sequences').insert({ organization_id: orgId, last_seq: 0 })
      await serviceClient.from('invoice_sequences').insert({ organization_id: orgId, last_seq: 0 })
      await serviceClient.from('payment_sequences').insert({ organization_id: orgId, last_seq: 0 })
    } catch {}

    // 3. Create or Update Owner in Supabase Auth & Users table with 8-digit password
    try {
      // Try creating in Supabase Auth
      const { data: authUser, error: authCreateErr } = await serviceClient.auth.admin.createUser({
        email: effectiveEmail,
        password: ownerTemporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: owner_name?.trim() || org_name,
          role: 'owner',
          organization_id: orgId,
        },
      })

      if (authCreateErr && authCreateErr.message.includes('already registered')) {
        // Find existing user and update password
        const { data: existingUser } = await serviceClient
          .from('users')
          .select('id')
          .eq('email', effectiveEmail)
          .single()

        if (existingUser) {
          await serviceClient.auth.admin.updateUserById(existingUser.id, {
            password: ownerTemporaryPassword,
            user_metadata: { organization_id: orgId },
          }).catch(() => {})
        }
      }

      // Upsert profile in users table
      await serviceClient.from('users').upsert({
        organization_id: orgId,
        email: effectiveEmail,
        full_name: owner_name?.trim() || org_name,
        phone: phone?.trim() || null,
        role: 'owner',
        is_active: true,
      }, { onConflict: 'email' })
    } catch (userErr) {
      console.warn('[Owner Auth Setup Warning]:', userErr)
    }

    // 4. Create Staff / Warden / Manager Accounts with 8-Digit Passwords
    const createdStaffCredentials: Array<{ name: string; email: string; temporary_password: string; role: string }> = []

    if (Array.isArray(staff_members) && staff_members.length > 0) {
      for (const staff of staff_members) {
        if (staff.name && (staff.phone || staff.email)) {
          const staffEmail = (staff.email?.trim() || `${staff.name.toLowerCase().replace(/[^a-z0-9]/g, '')}_${slug}@pgsetu.com`).toLowerCase()
          const staffTemporaryPassword = generate8DigitPassword()

          try {
            // Create in Supabase Auth
            await serviceClient.auth.admin.createUser({
              email: staffEmail,
              password: staffTemporaryPassword,
              email_confirm: true,
              user_metadata: {
                full_name: staff.name.trim(),
                role: staff.role || 'manager',
                organization_id: orgId,
              },
            }).catch(() => {})

            // Upsert in users table
            await serviceClient.from('users').upsert({
              organization_id: orgId,
              email: staffEmail,
              full_name: staff.name.trim(),
              phone: staff.phone?.trim() || null,
              role: staff.role || 'manager',
              is_active: true,
            }, { onConflict: 'email' })

            createdStaffCredentials.push({
              name: staff.name.trim(),
              email: staffEmail,
              temporary_password: staffTemporaryPassword,
              role: staff.role || 'manager',
            })
          } catch {}
        }
      }
    }

    // 5. Create Property Record
    const { data: property, error: propError } = await serviceClient
      .from('properties')
      .insert({
        organization_id: orgId,
        name: property_name.trim(),
        address: combinedAddress || address_line1 || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        phone: phone?.trim() || null,
      })
      .select()
      .single()

    if (propError || !property) {
      throw new Error(propError?.message || 'Failed to create property campus record.')
    }

    const propId = property.id

    // 6. Create Buildings, Floors, Rooms, Beds & Sub-Meters
    const bedLabels = ['A', 'B', 'C', 'D', 'E', 'F']
    let totalRoomsCreated = 0
    let totalBedsCreated = 0

    const buildingsCount = Math.min(Math.max(Number(num_buildings) || 1, 1), 5)
    const floorsCount = Math.min(Math.max(Number(num_floors) || 2, 1), 10)
    const roomsCount = Math.min(Math.max(Number(rooms_per_floor) || 4, 1), 20)
    const bedsPerRoomCount = Math.min(Math.max(Number(default_beds_per_room) || 2, 1), 6)

    for (let b = 1; b <= buildingsCount; b++) {
      const bldgName = buildingsCount > 1 ? `Building ${b}` : 'Main Building'
      const { data: building } = await serviceClient
        .from('buildings')
        .insert({
          organization_id: orgId,
          property_id: propId,
          name: bldgName,
          total_floors: floorsCount,
        })
        .select()
        .single()

      if (building) {
        for (let f = 0; f < floorsCount; f++) {
          const floorName = f === 0 ? 'Ground Floor' : `${f}${f === 1 ? 'st' : f === 2 ? 'nd' : 'rd'} Floor`
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
            for (let r = 1; r <= roomsCount; r++) {
              const roomNo = `${f}${String(r).padStart(2, '0')}`

              let roomSharing = 'double'
              let roomRentPaise = doubleRentPaise
              let bedCount = bedsPerRoomCount

              if (bedCount === 1) {
                roomSharing = 'single'
                roomRentPaise = singleRentPaise
              } else if (bedCount === 2) {
                roomSharing = 'double'
                roomRentPaise = doubleRentPaise
              } else if (bedCount === 3) {
                roomSharing = 'triple'
                roomRentPaise = tripleRentPaise
              } else if (bedCount >= 4) {
                roomSharing = 'four'
                roomRentPaise = fourRentPaise
              } else {
                roomRentPaise = defaultRentPaise
              }

              const { data: room } = await serviceClient
                .from('rooms')
                .insert({
                  organization_id: orgId,
                  floor_id: floor.id,
                  room_number: roomNo,
                  name: `Room ${roomNo}`,
                  room_type: roomSharing,
                  base_rent_paise: roomRentPaise,
                  capacity: bedCount,
                })
                .select()
                .single()

              if (room) {
                totalRoomsCreated++

                // Sub-meter registration
                if (electricity_billing_type === 'sub_meter') {
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
                    try {
                      await serviceClient.from('electricity_readings').insert({
                        organization_id: orgId,
                        meter_id: meter.id,
                        reading_date: new Date().toISOString().split('T')[0],
                        previous_reading: 0,
                        current_reading: 0,
                        rate_per_unit_paise: ratePerUnitPaise,
                        period_month: new Date().getMonth() + 1,
                        period_year: new Date().getFullYear(),
                      })
                    } catch {}
                  }
                }

                // Create Beds
                for (let bIdx = 0; bIdx < bedCount; bIdx++) {
                  const bedLabel = bedLabels[bIdx] || String(bIdx + 1)
                  try {
                    await serviceClient
                      .from('beds')
                      .insert({
                        organization_id: orgId,
                        room_id: room.id,
                        bed_label: bedLabel,
                        status: 'available',
                        base_rent_paise: roomRentPaise,
                      })
                  } catch {}
                  totalBedsCreated++
                }
              }
            }
          }
        }
      }
    }

    // 7. Seed Default Catalog & Message Templates
    try {
      await serviceClient.from('charge_catalog').insert([
        { organization_id: orgId, name: 'Monthly Rent', category: 'rent', default_price_paise: defaultRentPaise, is_system: true },
        { organization_id: orgId, name: 'Electricity Charges', category: 'electricity', default_price_paise: 0, is_system: true },
        { organization_id: orgId, name: 'Security Deposit', category: 'security_deposit', default_price_paise: depositFixedPaise, is_system: true },
        { organization_id: orgId, name: 'Guest Stay (Per Night)', category: 'guest', default_price_paise: 50000, is_system: false },
        { organization_id: orgId, name: 'Late Payment Fee', category: 'late_fee', default_price_paise: lateFeeDailyPaise, is_system: false },
        { organization_id: orgId, name: 'Room Cleaning Service', category: 'cleaning', default_price_paise: 20000, is_system: false },
      ])

      await serviceClient.from('message_templates').insert([
        {
          organization_id: orgId,
          name: 'Monthly Rent Invoice',
          event_type: 'invoice_created',
          channel: 'whatsapp',
          template_body: `Hello {{resident_name}},\n\nYour rent invoice *{{invoice_number}}* for *₹{{total_amount}}* has been generated for {{period}}.\nDue Date: {{due_date}}.\n\nPay online instantly via UPI: {{payment_link}}\n\nThank you,\n{{organization_name}}`,
          is_system: true,
        },
        {
          organization_id: orgId,
          name: 'Payment Receipt',
          event_type: 'payment_received',
          channel: 'whatsapp',
          template_body: `Dear {{resident_name}},\n\nWe have received your payment of *₹{{amount}}* (Receipt: {{payment_number}}).\nRemaining balance: ₹{{remaining_balance}}.\n\nView your live digital passbook at: {{portal_link}}\n\nRegards,\n{{organization_name}}`,
          is_system: true,
        },
      ])
    } catch {}

    return NextResponse.json({
      success: true,
      org_id: orgId,
      credentials: {
        email: effectiveEmail,
        temporary_password: ownerTemporaryPassword,
        full_name: owner_name?.trim() || org_name,
        phone: phone?.trim() || '',
        role: 'owner',
        login_url: '/login',
      },
      staff_credentials: createdStaffCredentials,
      summary: {
        organization_name: org.name,
        slug: org.slug,
        property_name: property.name,
        city: org.city,
        upi_id: effectiveUpiId,
        total_rooms: totalRoomsCreated,
        total_beds: totalBedsCreated,
        total_floors: floorsCount,
      },
    })
  } catch (err: any) {
    console.error('[Onboarding Error]:', err)
    return NextResponse.json({ error: err.message || 'Onboarding failed' }, { status: 500 })
  }
}
