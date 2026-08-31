import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isSuperAdminFromRequest } from '@/lib/admin-auth'

async function requireSuperAdmin(request: NextRequest) {
  if (isSuperAdminFromRequest(request)) {
    return { role: 'superadmin' }
  }
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

/**
 * GET /api/admin/billing
 * SaaS Billing & Invoicing Engine (₹10/Bed/Month)
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin session required.' }, { status: 403 })
    }

    const supabase = await createServiceClient()

    // 1. Fetch all PG organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug, phone, email, city, state, gstin, settings, created_at')
      .order('created_at', { ascending: false })

    if (orgsError) throw orgsError

    // 2. Fetch all beds grouped by org
    const { data: beds } = await supabase.from('beds').select('id, organization_id, status')

    // Current billing period
    const now = new Date()
    const currentMonthName = now.toLocaleString('default', { month: 'long' })
    const currentYear = now.getFullYear()
    const currentPeriodStr = `${currentMonthName} ${currentYear}`

    let totalManagedBeds = 0
    let totalExpectedMrrPaise = 0
    let totalCollectedPaise = 0
    let totalPendingPaise = 0

    // Construct PG SaaS Billing items
    const billingItems = (orgs || []).map((org) => {
      const settings = (org.settings as any) || {}
      const orgBeds = beds?.filter((b) => b.organization_id === org.id) || []
      const bedCount = orgBeds.length
      const occupiedBeds = orgBeds.filter((b) => b.status === 'occupied').length

      // ₹10 per bed per month
      const ratePerBedRupees = 10
      const monthlyFeeRupees = bedCount * ratePerBedRupees
      const monthlyFeePaise = monthlyFeeRupees * 100

      totalManagedBeds += bedCount
      totalExpectedMrrPaise += monthlyFeePaise

      // Check payment status from settings or default to pending
      const subscriptionStatus = settings.subscription_status || 'active'
      const lastPayment = settings.last_saas_payment || null
      const isCurrentMonthPaid = lastPayment && lastPayment.period === currentPeriodStr

      if (isCurrentMonthPaid) {
        totalCollectedPaise += monthlyFeePaise
      } else {
        totalPendingPaise += monthlyFeePaise
      }

      // Generate invoice number
      const invoiceNumber = `SETU-SAAS-${currentYear}-${org.slug.slice(0, 8).toUpperCase()}`

      // Pre-filled WhatsApp payment reminder link with SETU company UPI
      const cleanPhone = (org.phone || '').replace(/[^0-9]/g, '')
      const setuUpiId = 'pgsetu@icici' // Company Collection VPA
      const upiPaymentLink = `upi://pay?pa=${setuUpiId}&pn=PG-SETU%20Technologies&am=${monthlyFeeRupees}&cu=INR&tn=PG-SETU%20SaaS%20${currentMonthName}%20${org.name}`
      
      const whatsappMsg = `*PG-SETU Platform SaaS Invoice: ${currentPeriodStr}*\n\nHello *${org.name}*,\nYour monthly platform subscription invoice for *${bedCount} Managed Beds* (@ ₹10/bed) has been generated.\n\n📋 *Invoice No:* ${invoiceNumber}\n💰 *Total Amount Due:* ₹${monthlyFeeRupees.toLocaleString('en-IN')}\n📅 *Billing Cycle:* ${currentPeriodStr}\n\n👉 *Pay Instantly via UPI:* ${upiPaymentLink}\nUPI ID: \`${setuUpiId}\`\n\nThank you for choosing PG-SETU!\n_For any queries, reply to this message._`
      const whatsappUrl = cleanPhone ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}` : null

      return {
        org_id: org.id,
        org_name: org.name,
        slug: org.slug,
        owner_email: org.email,
        owner_phone: org.phone,
        city: org.city || 'India',
        total_beds: bedCount,
        occupied_beds: occupiedBeds,
        rate_per_bed_rupees: ratePerBedRupees,
        monthly_fee_rupees: monthlyFeeRupees,
        monthly_fee_paise: monthlyFeePaise,
        current_period: currentPeriodStr,
        invoice_number: invoiceNumber,
        billing_status: isCurrentMonthPaid ? 'paid' : 'pending',
        paid_at: isCurrentMonthPaid ? lastPayment.paid_at : null,
        paid_amount_rupees: isCurrentMonthPaid ? lastPayment.amount_rupees : 0,
        subscription_status: subscriptionStatus,
        whatsapp_url: whatsappUrl,
        upi_payment_link: upiPaymentLink,
      }
    })

    return NextResponse.json({
      success: true,
      current_period: currentPeriodStr,
      rate_per_bed_rupees: 10,
      kpis: {
        total_active_pgs: orgs?.length || 0,
        total_managed_beds: totalManagedBeds,
        total_expected_mrr_paise: totalExpectedMrrPaise,
        total_collected_paise: totalCollectedPaise,
        total_pending_paise: totalPendingPaise,
      },
      billing_items: billingItems,
    })
  } catch (err: any) {
    console.error('[Admin Billing Error]:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch SaaS billing' }, { status: 500 })
  }
}

/**
 * POST /api/admin/billing
 * Mark SaaS subscription invoice as paid / update status
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized. Super Admin session required.' }, { status: 403 })
    }

    const body = await request.json()
    const { org_id, action, period, amount_rupees, payment_method = 'UPI' } = body

    if (!org_id) {
      return NextResponse.json({ error: 'Organization ID is required.' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Fetch existing settings
    const { data: org, error: fetchErr } = await supabase
      .from('organizations')
      .select('id, name, settings')
      .eq('id', org_id)
      .single()

    if (fetchErr || !org) throw new Error('PG Organization not found.')

    const currentSettings = (org.settings as any) || {}

    if (action === 'mark_paid') {
      const now = new Date()
      const currentPeriod = period || `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`

      const updatedSettings = {
        ...currentSettings,
        last_saas_payment: {
          period: currentPeriod,
          amount_rupees: Number(amount_rupees) || 0,
          paid_at: now.toISOString(),
          payment_method,
          recorded_by: 'superadmin',
        },
        subscription_status: 'active',
      }

      const { error: updateErr } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', org_id)

      if (updateErr) throw updateErr

      return NextResponse.json({
        success: true,
        message: `SaaS fee of ₹${amount_rupees} for ${org.name} marked as PAID for ${currentPeriod}!`,
      })
    }

    if (action === 'toggle_status') {
      const { status } = body
      const updatedSettings = {
        ...currentSettings,
        subscription_status: status || 'active',
      }

      await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', org_id)

      return NextResponse.json({ success: true, message: `Status updated to ${status}` })
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update billing' }, { status: 500 })
  }
}
