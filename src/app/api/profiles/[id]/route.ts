import { NextResponse, type NextRequest } from 'next/server'
import { getDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestore'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

function getCollectionFromId(id: string): string | null {
  if (id.startsWith('TN')) return 'tenant_profiles'
  if (id.startsWith('OW')) return 'owner_profiles'
  return null
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const col = getCollectionFromId(id)
  if (!col) return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  try {
    const profile = await getDocument(col, id)
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    return NextResponse.json({ success: true, profile })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const col = getCollectionFromId(id)
  if (!col) return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  try {
    const body = await request.json()
    const { id: _id, type: _t, mobile: _m, created_at: _c, ...rest } = body
    await updateDocument(col, id, { ...rest, updated_at: new Date().toISOString() })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSuperAdminFromRequest(request)) return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const { id } = await context.params
  const col = getCollectionFromId(id)
  if (!col) return NextResponse.json({ error: 'Invalid profile ID' }, { status: 400 })
  try {
    await deleteDocument(col, id)
    return NextResponse.json({ success: true, message: `Profile ${id} deleted` })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}