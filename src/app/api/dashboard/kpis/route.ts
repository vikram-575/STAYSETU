import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'

import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'

/**
 * GET /api/dashboard/kpis
 * Returns dashboard KPIs for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]

    let bedStats: any[] = []
    let activeResidents = 0
    let monthInvoices: any[] = []
    let allOutstandingInvoices: any[] = []
    let todayPayments: any[] = []
    let deposits: any[] = []

    if (orgId && isValidUUID(orgId)) {
      const results = await Promise.allSettled([
        serviceClient.from('beds').select('status').eq('organization_id', orgId),
        serviceClient.from('residents').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
        serviceClient.from('invoices').select('total_paise, paid_paise, balance_paise, status').eq('organization_id', orgId).gte('period_start', monthStart).lte('period_start', monthEnd).not('status', 'in', '(cancelled,draft)'),
        serviceClient.from('invoices').select('balance_paise, status, due_date').eq('organization_id', orgId).not('status', 'in', '(cancelled,draft,paid)'),
        serviceClient.from('payments').select('amount_paise').eq('organization_id', orgId).eq('payment_date', today).eq('status', 'completed'),
        serviceClient.from('deposits').select('amount_paise').eq('organization_id', orgId).eq('is_refunded', false),
      ])
      if (results[0].status === 'fulfilled') bedStats = results[0].value.data ?? []
      if (results[1].status === 'fulfilled') activeResidents = results[1].value.count ?? 0
      if (results[2].status === 'fulfilled') monthInvoices = results[2].value.data ?? []
      if (results[3].status === 'fulfilled') allOutstandingInvoices = results[3].value.data ?? []
      if (results[4].status === 'fulfilled') todayPayments = results[4].value.data ?? []
      if (results[5].status === 'fulfilled') deposits = results[5].value.data ?? []
    }

    const totalBeds = bedStats?.length ?? 0
    const occupiedBeds = bedStats?.filter((b) => b.status === 'occupied').length ?? 0
    const availableBeds = bedStats?.filter((b) => b.status === 'available').length ?? 0
    const maintenanceBeds = bedStats?.filter((b) => b.status === 'maintenance').length ?? 0
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
    const monthExpectedPaise = monthInvoices?.reduce((s, i) => s + i.total_paise, 0) ?? 0
    const monthCollectedPaise = monthInvoices?.reduce((s, i) => s + i.paid_paise, 0) ?? 0
    const totalOutstandingPaise = allOutstandingInvoices?.reduce((s, i) => s + Math.max(i.balance_paise, 0), 0) ?? 0
    const totalOverduePaise = allOutstandingInvoices?.filter((i) => i.status === 'overdue' || (i.due_date < today && i.balance_paise > 0)).reduce((s, i) => s + Math.max(i.balance_paise, 0), 0) ?? 0
    const todayCollectedPaise = todayPayments?.reduce((s, p) => s + p.amount_paise, 0) ?? 0
    const depositsHeldPaise = deposits?.reduce((s, d) => s + d.amount_paise, 0) ?? 0
    const collectionRate = monthExpectedPaise > 0 ? Math.round((monthCollectedPaise / monthExpectedPaise) * 100) : 0

    return NextResponse.json({
      totalBeds, occupiedBeds, availableBeds, maintenanceBeds,
      occupancyRate, activeResidents: activeResidents ?? 0,
      monthExpectedPaise, monthCollectedPaise,
      monthOutstandingPaise: monthExpectedPaise - monthCollectedPaise,
      totalOutstandingPaise, totalOverduePaise,
      todayCollectedPaise, collectionRate, depositsHeldPaise,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch KPIs' }, { status: 500 })
  }
}
