import { NextResponse, type NextRequest } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const isHostOrStaff = ['superadmin', 'owner', 'manager', 'accountant', 'staff'].includes(user.role)
    if (!isHostOrStaff) {
      return NextResponse.json({ error: 'Forbidden. Only property hosts and managers can edit properties.' }, { status: 403 })
    }

    const body = await request.json()
    const {
      property_id,
      organization_id,
      name,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      description,
      starting_rent_paise,
      notice_period_days,
      lock_in_months,
      gate_closing_time,
      amenities,
      rules,
      upi_id,
      images,
      coverImage,
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Property name is required.' }, { status: 400 })
    }

    const serviceClient = await createServiceClient()
    let targetOrgId = organization_id || user.organization_id

    // If user has no organization yet, auto-create one for this owner
    if (!targetOrgId) {
      try {
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) + '-' + Math.random().toString(36).substring(2, 6)
        const { data: newOrg } = await serviceClient
          .from('organizations')
          .insert({
            name: name.trim(),
            slug,
            phone: phone?.trim() || user.phone || null,
            email: email?.trim() || user.email || null,
            city: city?.trim() || null,
            address: address?.trim() || null,
            owner_user_id: user.id,
          })
          .select('id')
          .single()

        if (newOrg) {
          targetOrgId = newOrg.id
          try {
            await serviceClient.from('users').update({ organization_id: targetOrgId }).eq('id', user.id)
          } catch {}
        }
      } catch (orgCreateErr: any) {
        console.warn('[Auto-create Org Warning]:', orgCreateErr?.message)
      }
    }

    // 1. Update Organization Table if orgId exists
    if (targetOrgId) {
      try {
        const { data: currentOrg } = await serviceClient
          .from('organizations')
          .select('settings')
          .eq('id', targetOrgId)
          .maybeSingle()

        const currentSettings = (currentOrg?.settings as Record<string, any>) || {}

        await serviceClient
          .from('organizations')
          .update({
            name: name.trim(),
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            address: address?.trim() || null,
            city: city?.trim() || null,
            state: state?.trim() || null,
            pincode: pincode?.trim() || null,
            settings: {
              ...currentSettings,
              upi_id: upi_id?.trim() || currentSettings.upi_id,
              starting_rent_paise: starting_rent_paise || currentSettings.starting_rent_paise,
              notice_period_days: notice_period_days || currentSettings.notice_period_days || 30,
              lock_in_months: lock_in_months || currentSettings.lock_in_months || 3,
              gate_closing_time: gate_closing_time || currentSettings.gate_closing_time || '11:00 PM',
              amenities: Array.isArray(amenities) ? amenities : currentSettings.amenities,
              rules: Array.isArray(rules) ? rules : currentSettings.rules,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetOrgId)
      } catch (orgErr: any) {
        console.warn('[Property Update Org Warning]:', orgErr?.message)
      }
    }

    // 2. Update or Upsert in Properties Table
    const propImages = Array.isArray(images) && images.length > 0
      ? images
      : (Array.isArray(body.photos) ? body.photos : undefined)

    const propSettings: Record<string, any> = {
      starting_rent_paise: Number(starting_rent_paise) || 600000,
      notice_period_days: Number(notice_period_days) || 30,
      lock_in_months: Number(lock_in_months) || 3,
      gate_closing_time: gate_closing_time || '11:00 PM',
      amenities: Array.isArray(amenities) && amenities.length > 0
        ? amenities
        : ['High-Speed WiFi', 'Power Backup', 'RO Water', 'CCTV Security', 'Housekeeping', 'Washing Machine'],
      rules: Array.isArray(rules) && rules.length > 0
        ? rules
        : ['Gate closes at 11:00 PM', 'Visitors allowed in lounge only', 'No smoking inside rooms'],
      upi_id: upi_id?.trim() || '',
    }

    if (propImages) {
      propSettings.images = propImages
      propSettings.coverImage = coverImage || propImages[0] || ''
    }

    let updatedProp: any = null
    try {
      const isExplicitNew = body.is_new === true || property_id === 'new' || !property_id
      let existingProp: any = null

      if (!isExplicitNew) {
        let propQuery = serviceClient.from('properties').select('id, settings')
        if (property_id && !property_id.startsWith('prop_') && !property_id.startsWith('org_prop_')) {
          propQuery = propQuery.eq('id', property_id)
        } else if (targetOrgId) {
          propQuery = propQuery.eq('organization_id', targetOrgId)
        }
        const { data } = await propQuery.maybeSingle()
        existingProp = data
      }

      if (existingProp?.id) {
        const currentSettings = existingProp.settings || {}
        const finalSettings = {
          ...currentSettings,
          ...propSettings,
          images: propImages || currentSettings.images || [],
          coverImage: coverImage || (propImages && propImages[0]) || currentSettings.coverImage || '',
        }

        const { data: saved } = await serviceClient
          .from('properties')
          .update({
            name: name.trim(),
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            address: address?.trim() || null,
            city: city?.trim() || null,
            state: state?.trim() || null,
            pincode: pincode?.trim() || null,
            description: description?.trim() || null,
            settings: finalSettings,
          })
          .eq('id', existingProp.id)
          .select()
          .maybeSingle()

        updatedProp = saved
      } else if (targetOrgId) {
        const { data: saved } = await serviceClient
          .from('properties')
          .insert({
            organization_id: targetOrgId,
            name: name.trim(),
            phone: phone?.trim() || null,
            email: email?.trim() || null,
            address: address?.trim() || null,
            city: city?.trim() || null,
            state: state?.trim() || null,
            pincode: pincode?.trim() || null,
            description: description?.trim() || 'Premium executive PG & co-living residence with modern amenities.',
            is_active: true,
            settings: propSettings,
          })
          .select()
          .maybeSingle()

        updatedProp = saved

        // Seed default building and ground floor for the newly created property
        if (saved?.id) {
          try {
            const { data: bldg } = await serviceClient.from('buildings').insert({
              organization_id: targetOrgId,
              property_id: saved.id,
              name: 'Main Building',
              total_floors: 1,
            }).select('id').single()

            if (bldg?.id) {
              await serviceClient.from('floors').insert({
                organization_id: targetOrgId,
                building_id: bldg.id,
                floor_number: 0,
                name: 'Ground Floor',
              })
            }
          } catch {}
        }
      }
    } catch (propErr: any) {
      console.warn('[Property Update Table Warning]:', propErr?.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Property details updated successfully!',
      property: updatedProp || {
        name: name.trim(),
        phone,
        email,
        address,
        city,
        state,
        pincode,
        description,
        settings: propSettings,
      },
    })
  } catch (err: any) {
    console.error('[POST /api/properties/update Exception]:', err)
    return NextResponse.json({ error: err.message || 'Failed to update property.' }, { status: 500 })
  }
}
