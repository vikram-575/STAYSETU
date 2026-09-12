import { NextResponse, type NextRequest } from 'next/server'
import { createDocument, queryCollection, updateDocument } from '@/lib/firebase/firestore'

const LEADS_COLLECTION = 'leads'

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_instant_leads__: any[] | undefined
}

if (!global.__pgsetu_instant_leads__) {
  global.__pgsetu_instant_leads__ = [
    {
      id: 'lead_demo_1',
      reference_code: 'PG-INSTA-8821',
      tenant_name: 'Priya Verma',
      user_name: 'Priya Verma',
      tenant_phone: '9876501234',
      user_phone: '9876501234',
      property_city: 'Bengaluru (Koramangala)',
      gender: 'girls',
      pg_type: 'girls',
      sharing_choice: 'Single Room',
      budget_range: '₹12,000 - ₹16,000',
      move_in_date: 'Immediate / Today',
      notes: 'Near Sony World Signal, Wi-Fi and food required',
      type: 'instant_pg',
      status: 'new',
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'lead_demo_2',
      reference_code: 'PG-INSTA-6419',
      tenant_name: 'Siddharth Rao',
      user_name: 'Siddharth Rao',
      tenant_phone: '9811223344',
      user_phone: '9811223344',
      property_city: 'Pune (Hinjewadi Phase 1)',
      gender: 'boys',
      pg_type: 'boys',
      sharing_choice: '2-Sharing',
      budget_range: '₹8,000 - ₹12,000',
      move_in_date: 'Within 3 Days',
      notes: 'Working in Wipro, needs parking for bike',
      type: 'instant_pg',
      status: 'contacted',
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    }
  ]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      property_id,
      property_name,
      property_city,
      owner_name,
      owner_phone,
      tenant_name,
      name,
      tenant_phone,
      phone,
      tenant_email,
      gender,
      pg_type,
      sharing_choice,
      budget_range,
      move_in_date,
      notes,
      type = 'instant_pg',
      scheduled_date,
      scheduled_time,
    } = body

    const finalName = (tenant_name || name || '').trim()
    const finalPhone = (tenant_phone || phone || '').replace(/\D/g, '')

    if (!finalName || !finalPhone) {
      return NextResponse.json(
        { success: false, error: 'Full name and 10-digit mobile number are required.' },
        { status: 400 }
      )
    }

    const referenceCode = `PG-INSTA-${Math.floor(1000 + Math.random() * 9000)}`

    const payload = {
      reference_code: referenceCode,
      property_id: property_id || '',
      property_name: property_name || (property_city ? `Instant Request for ${property_city}` : 'Instant PG Request'),
      property_city: property_city || 'Bengaluru',
      owner_name: owner_name || '',
      owner_phone: owner_phone || '',
      tenant_name: finalName,
      user_name: finalName,
      tenant_phone: finalPhone,
      user_phone: finalPhone,
      tenant_email: tenant_email?.trim() || '',
      gender: gender || pg_type || 'any',
      pg_type: pg_type || gender || 'any',
      sharing_choice: sharing_choice || '2-Sharing',
      budget_range: budget_range || '₹8,000 - ₹12,000',
      move_in_date: move_in_date || 'Immediate / Today',
      notes: notes || '',
      message: notes || '',
      type: type || 'instant_pg',
      status: 'new',
      scheduled_date: scheduled_date || move_in_date || new Date().toISOString().split('T')[0],
      scheduled_time: scheduled_time || '11:00 AM',
      time_slot: scheduled_time || '11:00 AM',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const doc = await createDocument(LEADS_COLLECTION, payload)

    // Also push to in-memory store for instant sync in Super Admin
    if (!global.__pgsetu_instant_leads__) {
      global.__pgsetu_instant_leads__ = []
    }
    global.__pgsetu_instant_leads__.unshift(doc)

    return NextResponse.json({
      success: true,
      referenceCode,
      lead: doc,
      message: 'Instant PG request registered successfully. Our team will contact you shortly.',
    })
  } catch (err: any) {
    console.error('Error in /api/enquiries POST:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const mobile = url.searchParams.get('mobile')
    const propertyId = url.searchParams.get('property_id')
    const search = url.searchParams.get('q')?.toLowerCase().trim()
    const limit = Number(url.searchParams.get('limit')) || 100

    const filters: Array<[string, any, any]> = []
    if (type && type !== 'all') filters.push(['type', '==', type])
    if (status && status !== 'all') filters.push(['status', '==', status])
    if (mobile) filters.push(['tenant_phone', '==', mobile])
    if (propertyId) filters.push(['property_id', '==', propertyId])

    const firestoreLeads = await queryCollection(
      LEADS_COLLECTION,
      filters,
      { field: 'created_at', direction: 'desc' },
      limit
    )

    // Combine with memory cache, deduping by id
    const combinedMap = new Map<string, any>()
    const memLeads = global.__pgsetu_instant_leads__ || []

    for (const l of memLeads) {
      if (type && type !== 'all' && l.type !== type) continue
      if (status && status !== 'all' && l.status !== status) continue
      combinedMap.set(l.id || l.reference_code, l)
    }

    for (const l of firestoreLeads) {
      combinedMap.set(l.id || l.reference_code, l)
    }

    let results = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    if (search) {
      results = results.filter(
        (l) =>
          (l.tenant_name || l.user_name || '').toLowerCase().includes(search) ||
          (l.tenant_phone || l.user_phone || '').includes(search) ||
          (l.property_city || '').toLowerCase().includes(search) ||
          (l.reference_code || '').toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      leads: results,
    })
  } catch (err: any) {
    console.error('Error in /api/enquiries GET:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes, assigned_property_name } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required.' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (assigned_property_name) updates.assigned_property_name = assigned_property_name

    await updateDocument(LEADS_COLLECTION, id, updates)

    // Update in-memory cache as well
    if (global.__pgsetu_instant_leads__) {
      const found = global.__pgsetu_instant_leads__.find((l) => l.id === id || l.reference_code === id)
      if (found) {
        Object.assign(found, updates)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully.',
    })
  } catch (err: any) {
    console.error('Error in /api/enquiries PATCH:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
