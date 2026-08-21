import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServiceClient()

    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name, slug, phone, email, settings, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch bed counts per org
    const { data: beds } = await supabase
      .from('beds')
      .select('id, organization_id')

    const subscriptions = orgs.map((org) => {
      const settings = org.settings || {}
      const orgBeds = beds?.filter((b) => b.organization_id === org.id) || []
      const bedCount = orgBeds.length
      const ratePerBedPaise = 1000 // ₹10.00 per bed / month (1000 paise)
      const monthlyFeePaise = Math.max(bedCount * ratePerBedPaise, 1000) // minimum ₹10
      const plan = settings.plan || 'per_bed'
      const status = settings.subscription_status || 'active'
      const validUntil = settings.subscription_valid_until || null

      return {
        org_id: org.id,
        org_name: org.name,
        slug: org.slug,
        contact_email: org.email,
        contact_phone: org.phone,
        plan: `₹10/Bed (${bedCount} Beds)`,
        total_beds: bedCount,
        rate_per_bed_rupees: 10,
        status,
        valid_until: validUntil,
        monthly_fee_paise: monthlyFeePaise,
        created_at: org.created_at,
      }
    })

    const totalMrr = subscriptions.reduce((s, sub) => s + (sub.status === 'active' ? sub.monthly_fee_paise : 0), 0)

    return NextResponse.json({
      success: true,
      mrr_paise: totalMrr,
      subscriptions,
      plan_tiers: [
        { id: 'per_bed', name: 'Standard SaaS', price_paise: 1000, unit: '₹10 / bed / month', features: ['₹10 per Managed Bed / Month', 'Unlimited Properties & Floors', '100% Real-time WhatsApp Invoicing', 'Sub-Meter Electricity Splitting', 'Resident KYC & Digital Passbook'] },
        { id: 'starter_25', name: '25-Bed PG', price_paise: 25000, unit: '₹250 / month', features: ['Up to 25 Beds (@ ₹10/bed)', '1 Campus', 'Full Digital Ledger'] },
        { id: 'standard_100', name: '100-Bed PG', price_paise: 100000, unit: '₹1,000 / month', features: ['Up to 100 Beds (@ ₹10/bed)', 'Multi-Building Support', 'Automated Daily Closing'] },
        { id: 'enterprise_500', name: '500-Bed Campus', price_paise: 500000, unit: '₹5,000 / month', features: ['Up to 500 Beds (@ ₹10/bed)', 'Unlimited Properties', 'Priority 24/7 Dedicated Support'] },
      ],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { org_id, plan, subscription_status, valid_until_months = 12 } = body

    if (!org_id) return NextResponse.json({ error: 'Organization ID is required.' }, { status: 400 })

    const supabase = await createServiceClient()

    const { data: org, error: fetchErr } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', org_id)
      .single()

    if (fetchErr || !org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    const currentSettings = org.settings || {}
    const newValidUntil = new Date(Date.now() + 86400000 * 30 * Number(valid_until_months)).toISOString().split('T')[0]

    const updatedSettings = {
      ...currentSettings,
      plan: plan || currentSettings.plan || 'starter',
      subscription_status: subscription_status || currentSettings.subscription_status || 'active',
      subscription_valid_until: newValidUntil,
      last_payment_date: new Date().toISOString().split('T')[0],
    }

    const { error: updateErr } = await supabase
      .from('organizations')
      .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
      .eq('id', org_id)

    if (updateErr) throw updateErr

    return NextResponse.json({
      success: true,
      message: 'Subscription plan updated successfully.',
      settings: updatedSettings,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update subscription' }, { status: 500 })
  }
}
