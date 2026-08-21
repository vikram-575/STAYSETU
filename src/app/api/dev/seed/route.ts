import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/dev/seed
 * Populates realistic demo PG data: Property, Buildings, Floors, Rooms, Beds, Residents, Assignments, Invoices, Payments, Electricity Readings, Extra Charges
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  const orgId = profile.organization_id

  try {
    // 1. Create or get property
    let { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
      .single()

    if (!property) {
      const { data: newProp } = await supabase
        .from('properties')
        .insert({
          organization_id: orgId,
          name: 'Green View Premium PG',
          city: 'Pune',
          address: 'Viman Nagar, Lane 4',
        })
        .select()
        .single()
      property = newProp
    }

    // 2. Create Buildings
    const { data: buildingA } = await supabase
      .from('buildings')
      .insert({
        organization_id: orgId,
        property_id: property!.id,
        name: 'Block A (Boys Wing)',
        total_floors: 3,
      })
      .select()
      .single()

    // 3. Create Floors
    const floorList = []
    for (let f = 1; f <= 3; f++) {
      const { data: floor } = await supabase
        .from('floors')
        .insert({
          organization_id: orgId,
          building_id: buildingA!.id,
          floor_number: f,
          name: `${f}${f === 1 ? 'st' : f === 2 ? 'nd' : 'rd'} Floor`,
        })
        .select()
        .single()
      floorList.push(floor)
    }

    // 4. Create Rooms & Beds
    const sampleResidents = [
      { name: 'Rahul Sharma', phone: '9876543210', rent: 6500 },
      { name: 'Amit Verma', phone: '9823456789', rent: 6000 },
      { name: 'Rohit Kumar', phone: '9765432109', rent: 7000 },
      { name: 'Priya Patel', phone: '9123456780', rent: 8000 },
      { name: 'Vikas Singh', phone: '9845123456', rent: 6000 },
      { name: 'Sneha Rao', phone: '9988776655', rent: 7500 },
      { name: 'Aditya Joshi', phone: '9871234560', rent: 6500 },
      { name: 'Manish Gupta', phone: '9712345678', rent: 6000 },
    ]

    let residentIdx = 0

    for (let i = 0; i < floorList.length; i++) {
      const floor = floorList[i]
      for (let r = 1; r <= 3; r++) {
        const roomNo = `${(i + 1) * 100 + r}`
        const { data: room } = await supabase
          .from('rooms')
          .insert({
            organization_id: orgId,
            floor_id: floor!.id,
            room_number: roomNo,
            name: `Room ${roomNo}`,
            capacity: 3,
            base_rent_paise: 600000,
          })
          .select()
          .single()

        // Electricity sub-meter for room
        const { data: meter } = await supabase
          .from('electricity_meters')
          .insert({
            organization_id: orgId,
            property_id: property!.id,
            room_id: room!.id,
            meter_number: `MTR-${roomNo}`,
            meter_type: 'sub',
            allocation_method: 'equal_split',
          })
          .select()
          .single()

        // Initial Reading
        await supabase.from('electricity_readings').insert({
          organization_id: orgId,
          meter_id: meter!.id,
          reading_date: new Date().toISOString().split('T')[0],
          previous_reading: 1000,
          current_reading: 1120,
          rate_per_unit_paise: 800,
          period_month: new Date().getMonth() + 1,
          period_year: new Date().getFullYear(),
        })

        // Create Beds
        const bedLabels = ['A', 'B', 'C']
        for (const lbl of bedLabels) {
          const isOccupied = residentIdx < sampleResidents.length
          const { data: bed } = await supabase
            .from('beds')
            .insert({
              organization_id: orgId,
              room_id: room!.id,
              bed_label: lbl,
              status: isOccupied ? 'occupied' : 'available',
              base_rent_paise: 600000,
            })
            .select()
            .single()

          // If resident assigned
          if (isOccupied) {
            const resData = sampleResidents[residentIdx]
            const regNo = `PG-${new Date().getFullYear()}-${String(residentIdx + 101).padStart(6, '0')}`

            const { data: res } = await supabase
              .from('residents')
              .insert({
                organization_id: orgId,
                registration_number: regNo,
                full_name: resData.name,
                phone: resData.phone,
                date_of_birth: '1998-05-15',
                status: 'active',
                permanent_city: 'Jaipur',
                id_type: 'aadhaar',
                id_number: `1234 5678 ${residentIdx + 1000}`,
              })
              .select()
              .single()

            // Assignment
            const { data: assign } = await supabase
              .from('resident_assignments')
              .insert({
                organization_id: orgId,
                resident_id: res!.id,
                bed_id: bed!.id,
                check_in_date: '2026-08-01',
                monthly_rent_paise: resData.rent * 100,
                billing_cycle_day: 1,
              })
              .select()
              .single()

            // Deposit
            await supabase.from('deposits').insert({
              organization_id: orgId,
              resident_id: res!.id,
              assignment_id: assign!.id,
              amount_paise: 1000000, // ₹10,000
              received_date: '2026-08-01',
              payment_method: 'upi',
            })

            // Generate Monthly Invoice
            const invNo = `INV-2026-08-${String(residentIdx + 1001).padStart(6, '0')}`
            const totalPaise = resData.rent * 100 + 75000 // Rent + ₹750 electricity
            const isPaid = residentIdx % 2 === 0
            const paidPaise = isPaid ? totalPaise : (residentIdx === 1 ? 400000 : 0)

            const { data: inv } = await supabase
              .from('invoices')
              .insert({
                organization_id: orgId,
                invoice_number: invNo,
                resident_id: res!.id,
                period_start: '2026-08-01',
                period_end: '2026-08-31',
                due_date: '2026-08-05',
                subtotal_paise: totalPaise,
                total_paise: totalPaise,
                paid_paise: paidPaise,
                balance_paise: totalPaise - paidPaise,
                status: isPaid ? 'paid' : (paidPaise > 0 ? 'partial' : 'overdue'),
              })
              .select()
              .single()

            // Invoice items
            await supabase.from('invoice_items').insert([
              {
                organization_id: orgId,
                invoice_id: inv!.id,
                description: 'Bed Rent - August 2026',
                category: 'rent',
                quantity: 1,
                unit_price_paise: resData.rent * 100,
                total_paise: resData.rent * 100,
              },
              {
                organization_id: orgId,
                invoice_id: inv!.id,
                description: 'Electricity Units Split',
                category: 'electricity',
                quantity: 1,
                unit_price_paise: 75000,
                total_paise: 75000,
              },
            ])

            // Ledger Entries
            await supabase.from('ledger_entries').insert({
              organization_id: orgId,
              resident_id: res!.id,
              entry_date: '2026-08-01',
              description: `August 2026 Statement: ${invNo}`,
              category: 'rent',
              entry_type: 'charge',
              debit_paise: totalPaise,
              credit_paise: 0,
            })

            if (paidPaise > 0) {
              const payNo = `PAY-2026-${String(residentIdx + 5001).padStart(6, '0')}`
              const { data: pay } = await supabase
                .from('payments')
                .insert({
                  organization_id: orgId,
                  payment_number: payNo,
                  resident_id: res!.id,
                  amount_paise: paidPaise,
                  payment_method: 'upi',
                  payment_date: '2026-08-04',
                  transaction_id: `UPI-9281729${residentIdx}`,
                  status: 'completed',
                })
                .select()
                .single()

              await supabase.from('ledger_entries').insert({
                organization_id: orgId,
                resident_id: res!.id,
                payment_id: pay!.id,
                entry_date: '2026-08-04',
                description: `Payment Received (UPI) - Ref: UPI-9281729${residentIdx}`,
                category: null,
                entry_type: 'payment',
                debit_paise: 0,
                credit_paise: paidPaise,
                payment_method: 'upi',
              })
            }

            residentIdx++
          }
        }
      }
    }

    // 5. Seed some sample expenses
    await supabase.from('expenses').insert([
      {
        organization_id: orgId,
        category: 'electricity',
        description: 'Main Grid MSEB Electricity Bill',
        amount_paise: 1250000, // ₹12,500
        expense_date: '2026-08-02',
        payment_method: 'upi',
        vendor: 'MSEB Electricity Board',
      },
      {
        organization_id: orgId,
        category: 'staff_salary',
        description: 'Cook & Caretaker Monthly Salary',
        amount_paise: 2200000, // ₹22,000
        expense_date: '2026-08-05',
        payment_method: 'bank_transfer',
        vendor: 'Ramesh Caretaker',
      },
      {
        organization_id: orgId,
        category: 'food_procurement',
        description: 'Monthly Groceries & Milk Supply',
        amount_paise: 1500000, // ₹15,000
        expense_date: '2026-08-08',
        payment_method: 'cash',
        vendor: 'Shree Grocery Mart',
      },
      {
        organization_id: orgId,
        category: 'internet',
        description: 'High-speed Fiber Broadband Plan',
        amount_paise: 250000, // ₹2,500
        expense_date: '2026-08-03',
        payment_method: 'upi',
        vendor: 'Airtel Fiber',
      },
    ])

    return NextResponse.json({ success: true, seeded_residents: residentIdx })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
