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

    const subscriptions = orgs.map((org) => {
      const settings = org.settings || {}
      const plan = settings.plan || 'starter'
      const status = settings.subscription_status || 'active'
      const validUntil = settings.subscription_valid_until || null
      const monthlyFeePaise = plan === 'enterprise' ? 499900 : plan === 'growth' ? 249900 : 99900

      return {
        org_id: org.id,
        org_name: org.name,
        slug: org.slug,
        contact_email: org.email,
        contact_phone: org.phone,
        plan,
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
        { id: 'starter', name: 'Starter Plan', price_paise: 99900, max_beds: 25, features: ['Up to 25 Beds', '1 Property', 'WhatsApp Automation', 'Digital Ledger'] },
        { id: 'growth', name: 'Growth Plan', price_paise: 249900, max_beds: 100, features: ['Up to 100 Beds', '3 Properties', 'Sub-Meter Electricity', 'Full Analytics'] },
        { id: 'enterprise', name: 'Enterprise Plan', price_paise: 499900, max_beds: 9999, features: ['Unlimited Beds & Properties', 'Dedicated Manager', 'Custom GST Billing', 'Priority 24/7 Support'] },
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
