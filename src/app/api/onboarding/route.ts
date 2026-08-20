import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/onboarding
 * Creates organization, user profile, property, and initial building
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { org_name, property_name, property_city, property_address, phone } = await request.json()

  if (!org_name || !property_name) {
    return NextResponse.json({ error: 'Organization name and property name are required' }, { status: 400 })
  }

  // Create organization
  const slug = org_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now()

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: org_name,
      slug,
      owner_user_id: user.id,
      phone: phone ?? null,
    })
    .select()
    .single()

  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })

  // Create user profile
  await supabase.from('users').insert({
    id: user.id,
    organization_id: org.id,
    email: user.email!,
    full_name: user.user_metadata?.full_name ?? user.email!.split('@')[0],
    phone: phone ?? null,
    role: 'owner',
  })

  // Initialize org sequence
  await supabase.from('organization_sequences').insert({
    organization_id: org.id,
    last_seq: 0,
  })

  // Initialize invoice & payment sequences
  await supabase.from('invoice_sequences').insert({ organization_id: org.id, last_seq: 0 })
  await supabase.from('payment_sequences').insert({ organization_id: org.id, last_seq: 0 })

  // Create property
  const { data: property } = await supabase
    .from('properties')
    .insert({
      organization_id: org.id,
      name: property_name,
      address: property_address ?? null,
      city: property_city ?? null,
    })
    .select()
    .single()

  // Create default building
  const { data: building } = await supabase
    .from('buildings')
    .insert({
      organization_id: org.id,
      property_id: property!.id,
      name: 'Main Building',
      total_floors: 3,
    })
    .select()
    .single()

  // Create default floors
  for (let i = 0; i < 3; i++) {
    await supabase.from('floors').insert({
      organization_id: org.id,
      building_id: building!.id,
      floor_number: i,
      name: i === 0 ? 'Ground Floor' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : 'rd'} Floor`,
    })
  }

  // Seed default message templates
  await supabase.rpc('seed_default_templates', { p_org_id: org.id })

  return NextResponse.json({ success: true, org_id: org.id })
}
