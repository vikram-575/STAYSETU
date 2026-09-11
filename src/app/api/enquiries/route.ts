import { NextResponse, type NextRequest } from 'next/server'
import { createDocument, queryCollection, updateDocument } from '@/lib/firebase/firestore'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

const LEADS_COLLECTION = 'leads'

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
      tenant_phone,
      tenant_email,
      sharing_choice,
      move_in_date,
      notes,
      type = 'visit',
      scheduled_date,
      scheduled_time,
    } = body

    if (!tenant_name || !tenant_phone) {
      return NextResponse.json(
        { success: false, error: 'Tenant full name and mobile number are required.' },
        { status: 400 }
      )
    }

    const payload = {
      property_id: property_id || '',
      property_name: property_name || 'Verified Property',
      property_city: property_city || '',
      owner_name: owner_name || '',
      owner_phone: owner_phone || '',
      tenant_name: tenant_name.trim(),
      user_name: tenant_name.trim(),
      tenant_phone: tenant_phone.trim(),
      user_phone: tenant_phone.trim(),
      tenant_email: tenant_email?.trim() || '',
      sharing_choice: sharing_choice || 'Single Room',
      move_in_date: move_in_date || 'Immediate',
      notes: notes || '',
      message: notes || '',
      type: type || 'visit',
      status: type === 'visit' ? 'visit_scheduled' : 'new',
      scheduled_date: scheduled_date || move_in_date || new Date().toISOString().split('T')[0],
      scheduled_time: scheduled_time || '11:00 AM',
      time_slot: scheduled_time || '11:00 AM',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const doc = await createDocument(LEADS_COLLECTION, payload)

    return NextResponse.json({
      success: true,
      lead: doc,
      message: 'Enquiry / visit request registered successfully.',
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
    const limit = Number(url.searchParams.get('limit')) || 100

    const filters: Array<[string, any, any]> = []
    if (type && type !== 'all') filters.push(['type', '==', type])
    if (status && status !== 'all') filters.push(['status', '==', status])
    if (mobile) filters.push(['tenant_phone', '==', mobile])
    if (propertyId) filters.push(['property_id', '==', propertyId])

    const leads = await queryCollection(
      LEADS_COLLECTION,
      filters,
      { field: 'created_at', direction: 'desc' },
      limit
    )

    return NextResponse.json({
      success: true,
      total: leads.length,
      leads,
    })
  } catch (err: any) {
    console.error('Error in /api/enquiries GET:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required.' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes

    await updateDocument(LEADS_COLLECTION, id, updates)

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully.',
    })
  } catch (err: any) {
    console.error('Error in /api/enquiries PATCH:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
