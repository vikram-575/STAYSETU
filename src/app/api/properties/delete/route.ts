import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/properties/delete
 * Body: { property_id: string }
 * Securely deletes a property listed by the authenticated PG Owner.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const isAuthorized = ['superadmin', 'owner', 'manager'].includes(user.role)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden. Only property hosts and managers can delete properties.' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const { property_id } = body

    if (!property_id) {
      return NextResponse.json({ error: 'property_id is required' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()

    // 1. Fetch property to verify ownership
    const { data: property, error: fetchErr } = await serviceClient
      .from('properties')
      .select('id, organization_id, name')
      .eq('id', property_id)
      .maybeSingle()

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    if (!property) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 })
    }

    // Verify organization ownership if user is not superadmin
    if (user.role !== 'superadmin' && user.organization_id && property.organization_id) {
      if (property.organization_id !== user.organization_id) {
        return NextResponse.json({ error: 'Forbidden. You do not own this property.' }, { status: 403 })
      }
    }

    // 2. Unlink or clean up child dependencies if any
    try {
      // Unlink residents assigned to this property
      await serviceClient
        .from('residents')
        .update({ property_id: null })
        .eq('property_id', property_id)
    } catch (e) {
      console.warn('[Delete Property Warning - Unlink Residents]:', e)
    }

    try {
      // Find buildings for this property
      const { data: bldgs } = await serviceClient
        .from('buildings')
        .select('id')
        .eq('property_id', property_id)

      const bldgIds = (bldgs || []).map((b) => b.id)
      if (bldgIds.length > 0) {
        // Find floors
        const { data: flrs } = await serviceClient
          .from('floors')
          .select('id')
          .in('building_id', bldgIds)

        const floorIds = (flrs || []).map((f) => f.id)
        if (floorIds.length > 0) {
          // Find rooms
          const { data: rms } = await serviceClient
            .from('rooms')
            .select('id')
            .in('floor_id', floorIds)

          const roomIds = (rms || []).map((r) => r.id)
          if (roomIds.length > 0) {
            // Delete beds
            await serviceClient.from('beds').delete().in('room_id', roomIds)
            // Delete rooms
            await serviceClient.from('rooms').delete().in('id', roomIds)
          }
          // Delete floors
          await serviceClient.from('floors').delete().in('id', floorIds)
        }
        // Delete buildings
        await serviceClient.from('buildings').delete().in('id', bldgIds)
      }
    } catch (e) {
      console.warn('[Delete Property Warning - Cleanup Structure]:', e)
    }

    // 3. Delete property record
    const { error: deleteErr } = await serviceClient
      .from('properties')
      .delete()
      .eq('id', property_id)

    if (deleteErr) {
      console.error('[Delete Property Error]:', deleteErr)
      // Fallback: Soft-delete if hard delete fails due to RLS or constraints
      await serviceClient
        .from('properties')
        .update({ is_active: false })
        .eq('id', property_id)

      return NextResponse.json({
        success: true,
        message: `Property "${property.name}" was deactivated and unlisted successfully.`,
        softDeleted: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Property "${property.name}" deleted successfully.`,
    })
  } catch (error: any) {
    console.error('Delete property caught exception:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
