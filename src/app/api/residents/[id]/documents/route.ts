import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/residents/[id]/documents
 * List all documents for this resident.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: residentId } = await params
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = await createServiceClient()
    const { data: documents, error } = await supabase
      .from('resident_documents')
      .select('*')
      .eq('resident_id', residentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, documents: documents || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch documents' }, { status: 500 })
  }
}

/**
 * POST /api/residents/[id]/documents
 * Upload a document directly into the resident's Secure Document Vault.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: residentId } = await params
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const orgId = await resolveEffectiveOrgId(user)
    if (!orgId || !isValidUUID(orgId)) {
      return NextResponse.json({ error: 'Valid organization required' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    const { data: resident } = await supabase
      .from('residents')
      .select('id, organization_id, full_name')
      .eq('id', residentId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    const body = await request.json()
    const { doc_name, doc_type, file_url, notes, status = 'verified' } = body

    if (!doc_name || !file_url) {
      return NextResponse.json({ error: 'doc_name and file_url are required' }, { status: 400 })
    }

    const validDocTypes = [
      'aadhaar', 'pan', 'passport', 'driving_licence',
      'voter_id', 'student_id', 'company_id', 'agreement',
      'police_verification', 'photo', 'other'
    ]
    const effectiveType = validDocTypes.includes(doc_type) ? doc_type : 'other'

    const now = new Date().toISOString()
    const { data: newDoc, error: insertErr } = await supabase
      .from('resident_documents')
      .insert({
        id: crypto.randomUUID(),
        organization_id: orgId,
        resident_id: residentId,
        doc_type: effectiveType,
        doc_name: doc_name.trim(),
        file_url: file_url.trim(),
        status: status === 'verified' ? 'verified' : 'uploaded',
        verified_by: user.id,
        verified_at: now,
        notes: notes || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (insertErr || !newDoc) {
      return NextResponse.json({ error: insertErr?.message || 'Failed to save document' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Document saved to vault successfully.',
      document: newDoc,
    })
  } catch (err: any) {
    console.error('[Document Upload Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to upload document' }, { status: 500 })
  }
}
