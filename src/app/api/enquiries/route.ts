import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createDocument, queryCollection, updateDocument } from '@/lib/firebase/firestore'

const LEADS_COLLECTION = 'leads'
const PLATFORM_ORG_ID = 'edd624d8-f3a0-4f92-b8b9-515c50ed8e98'

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_instant_leads__: any[] | undefined
}

if (!global.__pgsetu_instant_leads__) {
  global.__pgsetu_instant_leads__ = []
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
    const leadId = `lead_${Math.random().toString(36).substring(2, 9)}`

    const payload = {
      id: leadId,
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

    // 1. Primary Persistent Storage: Supabase
    try {
      const supabase = await createServiceClient()

      // A. Audit Log Entry
      await supabase.from('audit_logs').insert({
        organization_id: PLATFORM_ORG_ID,
        action: 'create',
        entity_type: 'lead',
        entity_label: referenceCode,
        user_name: finalName,
        after_data: payload,
        notes: `Instant PG Request: ${finalName} (+91 ${finalPhone}) for ${property_city || 'General'}`
      })

      // B. Settings Table Lead Registry (for ultra-fast multi-instance lookup)
      const { data: currentSettings } = await supabase
        .from('settings')
        .select('value')
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('key', 'marketplace_leads')
        .maybeSingle()

      const existingList: any[] = Array.isArray(currentSettings?.value) ? currentSettings.value : []
      const updatedList = [
        payload,
        ...existingList.filter((x: any) => x.reference_code !== referenceCode && x.id !== leadId)
      ].slice(0, 500)

      await supabase.from('settings').upsert({
        organization_id: PLATFORM_ORG_ID,
        key: 'marketplace_leads',
        value: updatedList,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'organization_id, key' })
    } catch (dbErr) {
      console.warn('[Enquiries POST] Supabase persistence error:', dbErr)
    }

    // 2. Secondary Storage: Firestore & In-Memory
    try {
      await createDocument(LEADS_COLLECTION, payload, leadId)
    } catch {}

    if (!global.__pgsetu_instant_leads__) {
      global.__pgsetu_instant_leads__ = []
    }
    global.__pgsetu_instant_leads__.unshift(payload)

    return NextResponse.json({
      success: true,
      referenceCode,
      lead: payload,
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
    const limit = Number(url.searchParams.get('limit')) || 150

    const combinedMap = new Map<string, any>()

    // 1. Fetch from Supabase (Primary Persistent Storage)
    try {
      const supabase = await createServiceClient()

      // A. Settings table registry
      const { data: sData } = await supabase
        .from('settings')
        .select('value')
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('key', 'marketplace_leads')
        .maybeSingle()

      if (Array.isArray(sData?.value)) {
        for (const l of sData.value) {
          const key = l.reference_code || l.id
          if (key) combinedMap.set(key, l)
        }
      }

      // B. Audit logs registry
      const { data: aData } = await supabase
        .from('audit_logs')
        .select('after_data, created_at')
        .eq('entity_type', 'lead')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (Array.isArray(aData)) {
        for (const row of aData) {
          if (row.after_data) {
            const l = row.after_data
            const key = l.reference_code || l.id
            if (key && !combinedMap.has(key)) {
              combinedMap.set(key, l)
            }
          }
        }
      }
    } catch (sbErr) {
      console.warn('[Enquiries GET] Supabase fetch warning:', sbErr)
    }

    // 2. Fetch from In-Memory
    const memLeads = global.__pgsetu_instant_leads__ || []
    for (const l of memLeads) {
      const key = l.reference_code || l.id
      if (key && !combinedMap.has(key)) {
        combinedMap.set(key, l)
      }
    }

    // 3. Fetch from Firestore (Fallback)
    try {
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

      for (const l of firestoreLeads) {
        const key = l.reference_code || l.id
        if (key && !combinedMap.has(key)) {
          combinedMap.set(key, l)
        }
      }
    } catch {}

    // 4. Sort and Filter
    let results = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )

    if (type && type !== 'all') {
      results = results.filter((l) => l.type === type)
    }

    if (status && status !== 'all') {
      results = results.filter((l) => l.status === status)
    }

    if (mobile) {
      results = results.filter((l) => (l.tenant_phone || l.user_phone || '').includes(mobile))
    }

    if (propertyId) {
      results = results.filter((l) => l.property_id === propertyId)
    }

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
      return NextResponse.json({ success: false, error: 'Lead ID or reference code is required.' }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (assigned_property_name) updates.assigned_property_name = assigned_property_name

    // 1. Update in Supabase
    try {
      const supabase = await createServiceClient()
      const { data: sData } = await supabase
        .from('settings')
        .select('value')
        .eq('organization_id', PLATFORM_ORG_ID)
        .eq('key', 'marketplace_leads')
        .maybeSingle()

      if (Array.isArray(sData?.value)) {
        const updatedList = sData.value.map((item: any) => {
          if (item.id === id || item.reference_code === id) {
            return { ...item, ...updates }
          }
          return item
        })

        await supabase.from('settings').upsert({
          organization_id: PLATFORM_ORG_ID,
          key: 'marketplace_leads',
          value: updatedList,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id, key' })
      }
    } catch (sbErr) {
      console.warn('[Enquiries PATCH] Supabase update warning:', sbErr)
    }

    // 2. Update Firestore
    try {
      await updateDocument(LEADS_COLLECTION, id, updates)
    } catch {}

    // 3. Update In-Memory Cache
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
