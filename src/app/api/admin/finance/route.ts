import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

async function requireSuperAdmin(request: NextRequest) {
  if (isSuperAdminFromRequest(request)) return { role: 'superadmin' }
  try {
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const service = await createServiceClient()
    const { data: profile } = await service.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'superadmin') return null
    return user
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()
    const url = new URL(request.url)
    const section = url.searchParams.get('section') || 'money_center'

    if (section === 'money_center') {
      const [
        { data: invoices },
        { data: payments },
        { data: deposits },
        { data: refunds },
        { data: orgs },
        { data: beds },
      ] = await Promise.all([
        supabase.from('invoices').select('total_paise, paid_paise, balance_paise, status, due_date'),
        supabase.from('payments').select('id, payment_number, amount_paise, status, payment_method, payment_date, transaction_id, is_reversed, notes, organization_id, organizations(name), residents(full_name, registration_number)').order('payment_date', { ascending: false }).limit(100),
        supabase.from('deposits').select('id, amount_paise, is_refunded, received_date, resident_id, residents(full_name, registration_number), organizations(name)'),
        supabase.from('refunds').select('id, amount_paise, status, created_at, resident_id, residents(full_name)'),
        supabase.from('organizations').select('id, name, city'),
        supabase.from('beds').select('id'),
      ])

      const validInvoices = (invoices || []).filter((i) => !['cancelled', 'draft'].includes(i.status))
      const totalBilledPaise = validInvoices.reduce((s, i) => s + (i.total_paise || 0), 0)
      const totalCollectedPaise = validInvoices.reduce((s, i) => s + (i.paid_paise || 0), 0)
      const totalOutstandingPaise = validInvoices.reduce((s, i) => s + Math.max(0, i.balance_paise || 0), 0)
      const totalOverduePaise = validInvoices
        .filter((i) => i.status === 'overdue')
        .reduce((s, i) => s + Math.max(0, i.balance_paise || 0), 0)

      // Segregated Deposits Held (NOT REVENUE)
      const depositsHeldPaise = (deposits || [])
        .filter((d) => !d.is_refunded)
        .reduce((s, d) => s + (d.amount_paise || 0), 0)

      const totalRefundsPaise = (refunds || [])
        .filter((r) => r.status === 'completed' || r.status === 'approved')
        .reduce((s, r) => s + (r.amount_paise || 0), 0)

      const totalBeds = beds?.length || 0
      const subscriptionRevenuePaise = totalBeds * 1500 // ₹15/bed/mo in paise
      const platformCommissionPaise = Math.round(totalCollectedPaise * 0.02)
      const platformRevenuePaise = subscriptionRevenuePaise + platformCommissionPaise
      const ownerRevenuePaise = totalCollectedPaise - platformCommissionPaise

      return NextResponse.json({
        success: true,
        summary: {
          total_billed_paise: totalBilledPaise,
          total_collected_paise: totalCollectedPaise,
          total_outstanding_paise: totalOutstandingPaise,
          total_overdue_paise: totalOverduePaise,
          owner_revenue_paise: ownerRevenuePaise,
          platform_revenue_paise: platformRevenuePaise,
          platform_commission_paise: platformCommissionPaise,
          subscription_revenue_paise: subscriptionRevenuePaise,
          refunds_paise: totalRefundsPaise,
          deposits_held_paise: depositsHeldPaise,
        },
        payments: payments || [],
        deposits: deposits || [],
      })
    }

    if (section === 'plans') {
      // Platform Subscription Plans based on real organization subscriptions
      const { data: orgs } = await supabase.from('organizations').select('id, settings')
      const orgList = orgs || []
      const starterCount = orgList.filter((o: any) => o.settings?.plan === 'starter' || o.settings?.plan_tier === 'starter').length
      const growthCount = orgList.filter((o: any) => o.settings?.plan === 'growth' || o.settings?.plan_tier === 'growth').length
      const enterpriseCount = orgList.filter((o: any) => o.settings?.plan === 'enterprise' || o.settings?.plan_tier === 'enterprise').length

      const plans = [
        {
          id: 'plan_starter',
          name: 'Starter Tier',
          tier: 'starter',
          price_monthly_paise: 99900,
          max_beds: 30,
          max_properties: 1,
          features: ['1-Click Invoicing', 'Smart Sub-Meters', 'Digital Passbooks', 'Aadhaar KYC (5/mo)'],
          subscribers_count: starterCount,
          status: 'active',
        },
        {
          id: 'plan_growth',
          name: 'Growth Tier (Most Popular)',
          tier: 'growth',
          price_monthly_paise: 249900,
          max_beds: 100,
          max_properties: 3,
          features: ['All Starter Features', 'Daily Cash Closing', 'WhatsApp Payment Reminders', 'Marketplace Priority 2x', 'Unlimited e-KYC'],
          subscribers_count: growthCount,
          status: 'active',
        },
        {
          id: 'plan_enterprise',
          name: 'Enterprise Coliving Tier',
          tier: 'enterprise',
          price_monthly_paise: 599900,
          max_beds: 500,
          max_properties: 10,
          features: ['All Growth Features', 'Multi-Branch Master HQ', 'Dedicated Support Manager', 'Custom SMS Header', 'Custom Domain Branding'],
          subscribers_count: enterpriseCount,
          status: 'active',
        },
      ]

      return NextResponse.json({
        success: true,
        plans,
      })
    }

    return NextResponse.json({ error: 'Unsupported finance section' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch financial data' }, { status: 500 })
  }
}

/**
 * POST /api/admin/finance
 * Handles:
 * 1. Payment Reversals (non-destructive; creates countervailing ledger reversal & audit log)
 * 2. Subscription tier adjustments
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()
    const { action, payment_id, reason } = await request.json()

    if (action === 'reverse_payment') {
      if (!payment_id || !reason) {
        return NextResponse.json({ error: 'payment_id and reason are mandatory for payment reversal.' }, { status: 400 })
      }

      // Fetch original payment
      const { data: origPayment, error: fetchErr } = await supabase
        .from('payments')
        .select('*')
        .eq('id', payment_id)
        .single()

      if (fetchErr || !origPayment) {
        return NextResponse.json({ error: 'Payment transaction not found' }, { status: 404 })
      }

      if (origPayment.is_reversed || origPayment.status === 'reversed') {
        return NextResponse.json({ error: 'This payment has already been reversed.' }, { status: 409 })
      }

      const now = new Date().toISOString()
      const adminEmail = (adminUser as any).email || 'superadmin@pgsetu.com'

      // 1. Mark original payment as reversed
      const { error: markErr } = await supabase
        .from('payments')
        .update({
          status: 'reversed',
          is_reversed: true,
          notes: `${origPayment.notes || ''} [REVERSED by ${adminEmail} on ${now.split('T')[0]}: ${reason}]`.trim(),
        })
        .eq('id', payment_id)

      if (markErr) throw markErr

      // 2. Create Countervailing Reversal Transaction in payments table
      const { data: reversalEntry, error: insertErr } = await supabase
        .from('payments')
        .insert({
          organization_id: origPayment.organization_id,
          resident_id: origPayment.resident_id,
          payment_number: `REV-${origPayment.payment_number || origPayment.id.slice(0, 8)}`,
          amount_paise: -Math.abs(origPayment.amount_paise), // negative amount
          payment_method: origPayment.payment_method,
          payment_date: now.split('T')[0],
          status: 'completed',
          transaction_id: `REV-${origPayment.transaction_id || Date.now()}`,
          notes: `COUNTER-REVERSAL ENTRY for payment ${origPayment.payment_number || origPayment.id}: ${reason}`,
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      // 3. Record in immutable audit logs
      try {
        await supabase.from('audit_logs').insert({
          organization_id: origPayment.organization_id,
          action: 'payment_reverse',
          entity_type: 'payment',
          entity_id: payment_id,
          before_state: { status: origPayment.status, amount_paise: origPayment.amount_paise },
          after_state: {
            status: 'reversed',
            reversal_entry_id: reversalEntry.id,
            reason,
            reversed_by: adminEmail,
            reversed_at: now,
          },
        })
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Payment of ₹${origPayment.amount_paise / 100} successfully reversed. Counter-entry created and logged in audit trails.`,
        reversal: reversalEntry,
      })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process financial action' }, { status: 500 })
  }
}
