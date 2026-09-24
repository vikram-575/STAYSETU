import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/residents/[id]/photo
 * Uploads or updates a resident's live profile photo.
 * Automatically synchronizes with:
 * 1. residents.photo_url
 * 2. users.avatar_url (for resident user login/profile)
 * 3. resident_documents (doc_type: 'photo')
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: residentId } = await params
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'Valid organization required' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const { data: resident } = await supabase
      .from('residents')
      .select('*')
      .eq('id', residentId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    const body = await request.json()
    const { photo_url } = body

    if (!photo_url || typeof photo_url !== 'string') {
      return NextResponse.json({ error: 'Valid photo_url is required' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // 1. Update residents.photo_url
    const { data: updatedResident, error: resErr } = await supabase
      .from('residents')
      .update({ photo_url, updated_at: now })
      .eq('id', residentId)
      .select()
      .single()

    if (resErr) {
      return NextResponse.json({ error: resErr.message || 'Failed to update resident photo' }, { status: 500 })
    }

    // 2. Insert/Update into resident_documents
    const { data: existingPhotoDoc } = await supabase
      .from('resident_documents')
      .select('id')
      .eq('resident_id', residentId)
      .eq('doc_type', 'photo')
      .maybeSingle()

    if (existingPhotoDoc) {
      await supabase
        .from('resident_documents')
        .update({
          file_url: photo_url,
          status: 'verified',
          verified_at: now,
          updated_at: now,
        })
        .eq('id', existingPhotoDoc.id)
    } else {
      await supabase.from('resident_documents').insert({
        id: crypto.randomUUID(),
        organization_id: orgId,
        resident_id: residentId,
        doc_type: 'photo',
        doc_name: 'Resident Live Photo (Profile)',
        file_url: photo_url,
        status: 'verified',
        verified_by: user.id,
        verified_at: now,
        notes: 'Live profile photo updated',
        created_at: now,
        updated_at: now,
      })
    }

    // 3. Update users.avatar_url
    try {
      if (resident.phone) {
        const cleanPhone = resident.phone.replace(/\D/g, '').slice(-10)
        await supabase
          .from('users')
          .update({ avatar_url: photo_url, updated_at: now })
          .or(`phone.ilike.%${cleanPhone}%,resident_id.eq.${residentId}`)
      }
    } catch (err: any) {
      console.warn('[Photo Route] user avatar sync warning:', err?.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Live photo uploaded and synchronized to profile successfully.',
      photo_url,
      resident: updatedResident,
    })
  } catch (err: any) {
    console.error('[Resident Photo Upload Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to upload photo' }, { status: 500 })
  }
}
