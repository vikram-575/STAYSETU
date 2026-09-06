import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rupeesToPaise } from '@/lib/money'

export async function POST() {
  try {
    const supabase = await createServiceClient()

    const pgData = [
      {
        orgName: 'Stanza Living Orchid House',
        propertyName: 'Orchid House Koramangala',
        address: '4th Block, 80 Feet Road, Koramangala',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        ownerName: 'Vikram Rathore',
        ownerEmail: 'vikram.rathore@stanzaliving.com',
        ownerPhone: '9876543210',
        ownerPassword: '84920183',
        tenants: [
          {
            name: 'Rahul Sharma',
            phone: '9871100101',
            dob: '1998-05-14',
            gender: 'male',
            rent: 8500,
            deposit: 10000,
            room: '101',
            bed: '1',
            kycId: 'PG-AAD-102938',
            address: 'Flat 402, Royal Enclave, Jaipur, Rajasthan',
          },
          {
            name: 'Amit Verma',
            phone: '9871100102',
            dob: '1999-08-22',
            gender: 'male',
            rent: 8500,
            deposit: 10000,
            room: '101',
            bed: '2',
            kycId: 'PG-AAD-102939',
            address: 'House 12, Civil Lines, Lucknow, UP',
          },
          {
            name: 'Priya Nair',
            phone: '9871100103',
            dob: '2000-03-10',
            gender: 'female',
            rent: 11000,
            deposit: 15000,
            room: '102',
            bed: '1',
            kycId: 'PG-AAD-102940',
            address: 'TC 15/22, Kowdiar, Trivandrum, Kerala',
          },
          {
            name: 'Sneha Patel',
            phone: '9871100104',
            dob: '1997-11-28',
            gender: 'female',
            rent: 8500,
            deposit: 10000,
            room: '102',
            bed: '2',
            kycId: 'PG-AAD-102941',
            address: 'A-201, Shivalik Hills, Ahmedabad, Gujarat',
          },
          {
            name: 'Karan Mehta',
            phone: '9871100105',
            dob: '1996-07-19',
            gender: 'male',
            rent: 12000,
            deposit: 15000,
            room: '201',
            bed: '1',
            kycId: 'PG-AAD-102942',
            address: 'B-44, Malviya Nagar, New Delhi',
          },
        ],
      },
      {
        orgName: 'Zolo Stays Signature Co-Living',
        propertyName: 'Zolo Signature HSR',
        address: 'Sector 4, 19th Main Road, HSR Layout',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560102',
        ownerName: 'Ananya Deshmukh',
        ownerEmail: 'ananya.deshmukh@zolostays.com',
        ownerPhone: '9823456789',
        ownerPassword: '73910482',
        tenants: [
          {
            name: 'Rohan Kulkarni',
            phone: '9821100201',
            dob: '1997-04-12',
            gender: 'male',
            rent: 9500,
            deposit: 12000,
            room: '101',
            bed: '1',
            kycId: 'PG-AAD-203941',
            address: 'Plot 55, Kothrud, Pune, Maharashtra',
          },
          {
            name: 'Pooja Hegde',
            phone: '9821100202',
            dob: '1999-09-15',
            gender: 'female',
            rent: 9500,
            deposit: 12000,
            room: '101',
            bed: '2',
            kycId: 'PG-AAD-203942',
            address: 'Kadri Hills, Mangalore, Karnataka',
          },
          {
            name: 'Varun Joshi',
            phone: '9821100203',
            dob: '1995-12-01',
            gender: 'male',
            rent: 14000,
            deposit: 20000,
            room: '102',
            bed: '1',
            kycId: 'PG-AAD-203943',
            address: '88, Race Course Road, Indore, MP',
          },
          {
            name: 'Divya Swaminathan',
            phone: '9821100204',
            dob: '2001-02-18',
            gender: 'female',
            rent: 7500,
            deposit: 10000,
            room: '201',
            bed: '1',
            kycId: 'PG-AAD-203944',
            address: 'Anna Nagar West, Chennai, Tamil Nadu',
          },
          {
            name: 'Siddharth Sen',
            phone: '9821100205',
            dob: '1998-10-25',
            gender: 'male',
            rent: 7500,
            deposit: 10000,
            room: '201',
            bed: '2',
            kycId: 'PG-AAD-203945',
            address: 'Salt Lake Sector 3, Kolkata, West Bengal',
          },
        ],
      },
      {
        orgName: 'Olive PG & Luxury Hostel',
        propertyName: 'Olive Cyber Residency',
        address: 'DLF Phase 2, Near Cyber Hub',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122002',
        ownerName: 'Rajesh Khurana',
        ownerEmail: 'rajesh.khurana@olivepg.com',
        ownerPhone: '9811223344',
        ownerPassword: '62849103',
        tenants: [
          {
            name: 'Abhinav Gupta',
            phone: '9811100301',
            dob: '1996-06-30',
            gender: 'male',
            rent: 10000,
            deposit: 15000,
            room: '101',
            bed: '1',
            kycId: 'PG-AAD-304951',
            address: 'Sector 15, Chandigarh, Punjab',
          },
          {
            name: 'Simran Kaur',
            phone: '9811100302',
            dob: '1998-01-20',
            gender: 'female',
            rent: 10000,
            deposit: 15000,
            room: '101',
            bed: '2',
            kycId: 'PG-AAD-304952',
            address: 'Model Town, Ludhiana, Punjab',
          },
          {
            name: 'Mohit Chauhan',
            phone: '9811100303',
            dob: '1997-08-14',
            gender: 'male',
            rent: 13500,
            deposit: 18000,
            room: '102',
            bed: '1',
            kycId: 'PG-AAD-304953',
            address: 'Rajpur Road, Dehradun, Uttarakhand',
          },
          {
            name: 'Neha Singhal',
            phone: '9811100304',
            dob: '2000-11-05',
            gender: 'female',
            rent: 8000,
            deposit: 10000,
            room: '201',
            bed: '1',
            kycId: 'PG-AAD-304954',
            address: 'Shastri Nagar, Meerut, UP',
          },
          {
            name: 'Aditya Kapoor',
            phone: '9811100305',
            dob: '1999-04-08',
            gender: 'male',
            rent: 8000,
            deposit: 10000,
            room: '201',
            bed: '2',
            kycId: 'PG-AAD-304955',
            address: 'Sector 62, Noida, UP',
          },
        ],
      },
      {
        orgName: 'Sri Balaji Executive Mens PG',
        propertyName: 'Sri Balaji Residency Gachibowli',
        address: 'Telecom Nagar, Gachibowli',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500032',
        ownerName: 'Venkatesh Reddy',
        ownerEmail: 'venkatesh.reddy@balajipg.com',
        ownerPhone: '9988776655',
        ownerPassword: '51938204',
        tenants: [
          {
            name: 'Harish Rao',
            phone: '9981100401',
            dob: '1997-03-24',
            gender: 'male',
            rent: 7000,
            deposit: 8000,
            room: '101',
            bed: '1',
            kycId: 'PG-AAD-405961',
            address: 'Nakkalagutta, Hanamkonda, Warangal',
          },
          {
            name: 'Suresh Varma',
            phone: '9981100402',
            dob: '1995-09-11',
            gender: 'male',
            rent: 7000,
            deposit: 8000,
            room: '101',
            bed: '2',
            kycId: 'PG-AAD-405962',
            address: 'Bhimavaram, West Godavari, Andhra Pradesh',
          },
          {
            name: 'Sandeep Goud',
            phone: '9981100403',
            dob: '1998-12-17',
            gender: 'male',
            rent: 9000,
            deposit: 10000,
            room: '102',
            bed: '1',
            kycId: 'PG-AAD-405963',
            address: 'Ashok Nagar, Nizamabad, Telangana',
          },
          {
            name: 'Nikhil Teja',
            phone: '9981100404',
            dob: '2001-05-03',
            gender: 'male',
            rent: 6500,
            deposit: 8000,
            room: '201',
            bed: '1',
            kycId: 'PG-AAD-405964',
            address: 'Gandhi Nagar, Kurnool, Andhra Pradesh',
          },
          {
            name: 'Manoj Kumar',
            phone: '9981100405',
            dob: '1999-07-29',
            gender: 'male',
            rent: 6500,
            deposit: 8000,
            room: '201',
            bed: '2',
            kycId: 'PG-AAD-405965',
            address: 'MVP Colony, Visakhapatnam, Andhra Pradesh',
          },
        ],
      },
    ]

    const seededOrganizations: any[] = []

    for (const pg of pgData) {
      const slug = pg.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)

      // 1. Create / Upsert Supabase Auth User for Owner
      let authUserId = ''
      try {
        const { data: userList } = await supabase.auth.admin.listUsers()
        const existing = userList?.users?.find((u) => u.email?.toLowerCase() === pg.ownerEmail.toLowerCase())

        if (existing) {
          await supabase.auth.admin.deleteUser(existing.id)
        }

        const { data: createdAuth, error: authErr } = await supabase.auth.admin.createUser({
          email: pg.ownerEmail,
          password: pg.ownerPassword,
          email_confirm: true,
          user_metadata: { full_name: pg.ownerName, role: 'owner' },
        })

        if (createdAuth?.user) {
          authUserId = createdAuth.user.id
        } else if (authErr) {
          console.error('Auth create error:', authErr)
        }
      } catch (err) {
        console.warn('Auth user setup note:', err)
      }

      // 2. Insert Organization
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .upsert(
          {
            name: pg.orgName,
            slug,
            address: pg.address,
            city: pg.city,
            state: pg.state,
            pincode: pg.pincode,
            phone: pg.ownerPhone,
            email: pg.ownerEmail,
            settings: {
              currency: 'INR',
              saas_billed_beds: 10,
              saas_monthly_rate_per_bed: 10,
            },
          },
          { onConflict: 'slug' }
        )
        .select()
        .single()

      if (orgErr || !org) {
        console.error('Org create error:', orgErr)
        continue
      }

      const orgId = org.id

      // 3. Upsert User in users table
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', pg.ownerEmail).maybeSingle()
      const effectiveUserId = authUserId || existingUser?.id || crypto.randomUUID()

      const { error: userErr } = await supabase.from('users').upsert(
        {
          id: effectiveUserId,
          organization_id: orgId,
          email: pg.ownerEmail,
          full_name: pg.ownerName,
          phone: pg.ownerPhone,
          role: 'owner',
          is_active: true,
        },
        { onConflict: 'id' }
      )

      if (userErr) {
        console.error('User upsert error:', userErr)
      }

      // 4. Create Property
      const { data: prop } = await supabase
        .from('properties')
        .upsert(
          {
            organization_id: orgId,
            name: pg.propertyName,
            address: pg.address,
            city: pg.city,
            state: pg.state,
            pincode: pg.pincode,
            phone: pg.ownerPhone,
            email: pg.ownerEmail,
          },
          { onConflict: 'organization_id,name' }
        )
        .select()
        .single()

      const propertyId = prop?.id

      // 5. Create Building
      const { data: building } = await supabase
        .from('buildings')
        .upsert(
          {
            organization_id: orgId,
            property_id: propertyId,
            name: 'Main Block',
            floors_count: 2,
          },
          { onConflict: 'organization_id,property_id,name' }
        )
        .select()
        .single()

      const buildingId = building?.id

      // 6. Create Floors
      const { data: floor1 } = await supabase
        .from('floors')
        .upsert({ organization_id: orgId, building_id: buildingId, name: '1st Floor', floor_number: 1 }, { onConflict: 'organization_id,building_id,floor_number' })
        .select()
        .single()

      const { data: floor2 } = await supabase
        .from('floors')
        .upsert({ organization_id: orgId, building_id: buildingId, name: '2nd Floor', floor_number: 2 }, { onConflict: 'organization_id,building_id,floor_number' })
        .select()
        .single()

      // 7. Create Rooms
      const { data: room101 } = await supabase
        .from('rooms')
        .upsert({ organization_id: orgId, floor_id: floor1?.id, room_number: '101', room_type: 'double', base_rent_paise: rupeesToPaise(8500), total_beds: 2, occupied_beds: 2 }, { onConflict: 'organization_id,floor_id,room_number' })
        .select().single()

      const { data: room102 } = await supabase
        .from('rooms')
        .upsert({ organization_id: orgId, floor_id: floor1?.id, room_number: '102', room_type: 'double', base_rent_paise: rupeesToPaise(8500), total_beds: 2, occupied_beds: 2 }, { onConflict: 'organization_id,floor_id,room_number' })
        .select().single()

      const { data: room201 } = await supabase
        .from('rooms')
        .upsert({ organization_id: orgId, floor_id: floor2?.id, room_number: '201', room_type: 'double', base_rent_paise: rupeesToPaise(7500), total_beds: 2, occupied_beds: 2 }, { onConflict: 'organization_id,floor_id,room_number' })
        .select().single()

      // 8. Create Beds
      const bedsMap: Record<string, string> = {}

      for (const [rNum, rObj] of Object.entries({ '101': room101, '102': room102, '201': room201 })) {
        if (!rObj) continue
        for (const bLabel of ['1', '2']) {
          const { data: bed } = await supabase
            .from('beds')
            .upsert(
              {
                organization_id: orgId,
                room_id: rObj.id,
                bed_number: bLabel,
                bed_label: `${rNum}-${bLabel}`,
                monthly_rent_paise: rObj.base_rent_paise,
                status: 'occupied',
              },
              { onConflict: 'organization_id,room_id,bed_number' }
            )
            .select().single()

          if (bed) {
            bedsMap[`${rNum}-${bLabel}`] = bed.id
          }
        }
      }

      // 9. Create 5 Tenants per PG
      const seededTenants: any[] = []

      for (let idx = 0; idx < pg.tenants.length; idx++) {
        const t = pg.tenants[idx]
        const regNumber = `PG-${org.slug?.slice(0, 4).toUpperCase() || 'SETU'}-${1000 + idx + 1}`
        const bedId = bedsMap[`${t.room}-${t.bed}`]

        // Find existing resident or insert new
        let { data: resident } = await supabase
          .from('residents')
          .select('*')
          .eq('organization_id', orgId)
          .eq('phone', t.phone)
          .maybeSingle()

        if (!resident) {
          const { data: newRes, error: resErr } = await supabase
            .from('residents')
            .insert({
              organization_id: orgId,
              registration_number: regNumber,
              full_name: t.name,
              phone: t.phone,
              email: `${t.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              date_of_birth: t.dob,
              gender: t.gender,
              permanent_address: t.address,
              permanent_city: pg.city,
              permanent_state: pg.state,
              emergency_name: 'Parent / Guardian',
              emergency_phone: '9870000000',
              emergency_relation: 'Parent',
              id_type: 'aadhaar',
              id_number: `XXXX XXXX ${t.phone.slice(-4)}`,
              status: 'active',
              notes: `Aadhaar Verified (${t.kycId})`,
            })
            .select()
            .single()

          if (resErr) {
            console.error('Insert resident error:', resErr)
          }
          resident = newRes
        }

        if (resident) {
          // Create Assignment if not exists
          if (bedId) {
            const { data: existingAssign } = await supabase
              .from('resident_assignments')
              .select('id')
              .eq('organization_id', orgId)
              .eq('resident_id', resident.id)
              .maybeSingle()

            if (!existingAssign) {
              await supabase.from('resident_assignments').insert({
                organization_id: orgId,
                resident_id: resident.id,
                bed_id: bedId,
                check_in_date: '2026-08-01',
                monthly_rent_paise: rupeesToPaise(t.rent),
                billing_cycle_day: 1,
                status: 'active',
              })
            }
          }

          // Create Security Deposit if not exists
          const { data: existingDep } = await supabase
            .from('deposits')
            .select('id')
            .eq('organization_id', orgId)
            .eq('resident_id', resident.id)
            .maybeSingle()

          if (!existingDep) {
            await supabase.from('deposits').insert({
              organization_id: orgId,
              resident_id: resident.id,
              amount_paise: rupeesToPaise(t.deposit),
              payment_method: 'upi',
              payment_date: '2026-08-01',
              status: 'held',
              is_refunded: false,
              receipt_number: `DEP-${regNumber}`,
            })
          }

          // Create KYC Verified record in tenant_kyc
          try {
            await supabase.from('tenant_kyc').upsert(
              {
                organization_id: orgId,
                tenant_id: resident.id,
                verification_id: t.kycId,
                verification_status: 'verified',
                verification_method: 'authorized_otp',
                masked_identifier: `XXXX XXXX ${t.phone.slice(-4)}`,
                provider: 'UIDAI GSP Authorized Provider',
                tenant_name: t.name,
                name_match_status: 'match',
                dob_match_status: 'match',
                gender_match_status: 'match',
                verified_at: new Date().toISOString(),
                risk_level: 'low',
                metadata: {
                  extracted_name: t.name,
                  extracted_dob: t.dob,
                  extracted_gender: t.gender === 'female' ? 'F' : 'M',
                },
              },
              { onConflict: 'verification_id' }
            )
          } catch {}

          seededTenants.push({
            name: t.name,
            phone: t.phone,
            dob: t.dob,
            room: `Room ${t.room} (Bed ${t.bed})`,
            monthlyRent: `₹${t.rent.toLocaleString('en-IN')}`,
            deposit: `₹${t.deposit.toLocaleString('en-IN')}`,
            kycStatus: `🟢 Verified (${t.kycId})`,
            passbookLogin: {
              url: 'http://localhost:3000/portal',
              mobile: t.phone,
              dob: t.dob,
            },
          })
        }
      }

      seededOrganizations.push({
        pgName: pg.orgName,
        property: pg.propertyName,
        location: `${pg.city}, ${pg.state}`,
        ownerLogin: {
          url: 'http://localhost:3000/login',
          email: pg.ownerEmail,
          password: pg.ownerPassword,
        },
        tenants: seededTenants,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully deployed 4 realistic PGs with 5 KYC-verified tenants each!',
      data: seededOrganizations,
    })
  } catch (err: any) {
    console.error('Seed Error:', err)
    return NextResponse.json({ error: err.message || 'Seeding failed' }, { status: 500 })
  }
}
