import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { sendWhatsAppMessage } from '@/lib/whatsapp/sender'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId') || user?.organization_id

    let query = supabase
      .from('v_resident_current')
      .select('resident_id, full_name, phone, room_number, total_outstanding_paise, status')
      .eq('status', 'active')
      .gt('total_outstanding_paise', 0)
      .order('total_outstanding_paise', { ascending: false })

    if (orgId) {
      query = query.eq('organization_id', orgId)
    }

    const { data: defaulters, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const totalOverduePaise = (defaulters || []).reduce((acc: number, cur: any) => acc + (cur.total_outstanding_paise || 0), 0)

    return NextResponse.json({
      success: true,
      cadenceSchedule: [
        { tier: 1, day: 1, label: 'Gentle 1st of Month Reminder', tone: 'Polite' },
        { tier: 2, day: 3, label: 'Due Date 3rd of Month Reminder', tone: 'Action-Oriented' },
        { tier: 3, day: 5, label: 'Overdue 5th+ of Month Notice', tone: 'Urgent' },
      ],
      pendingDefaultersCount: defaulters?.length || 0,
      totalOverdueInr: Math.round(totalOverduePaise / 100),
      eligibleResidents: defaulters || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch cadence status' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    const supabase = await createServiceClient()
    const body = await request.json()
    const { tier = 1, dryRun = false, orgId = user?.organization_id } = body

    let query = supabase
      .from('v_resident_current')
      .select('resident_id, full_name, phone, room_number, total_outstanding_paise, organization_id')
      .eq('status', 'active')
      .gt('total_outstanding_paise', 0)

    if (orgId) {
      query = query.eq('organization_id', orgId)
    }

    const { data: defaulters, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const list = defaulters || []
    const results: any[] = []

    for (const res of list) {
      const balanceInr = Math.round((res.total_outstanding_paise || 0) / 100)
      const upiUrl = `upi://pay?pa=pgsetu@icici&pn=PGSetu&am=${balanceInr}&cu=INR&tn=Rent_Room_${res.room_number}`
      let messageText = ''

      if (tier === 1) {
        messageText = `Hi *${res.full_name}*! 👋 Gentle reminder from PG-Setu: Your room rent for Room *${res.room_number}* is due for this month.\n\n• Amount: *₹${balanceInr.toLocaleString('en-IN')}*\n• Pay instantly via UPI:\n${upiUrl}\n\nThank you! ✨`
      } else if (tier === 2) {
        messageText = `Hello *${res.full_name}*! ⏰ Today is your rent due date for Room *${res.room_number}*.\n\n• Pending Balance: *₹${balanceInr.toLocaleString('en-IN')}*\n• Quick UPI Payment:\n${upiUrl}\n\nPlease complete payment today to avoid late fees.`
      } else {
        messageText = `⚠️ *URGENT OVERDUE NOTICE*\n\nDear *${res.full_name}*, rent payment for Room *${res.room_number}* is overdue.\n\n• Outstanding Balance: *₹${balanceInr.toLocaleString('en-IN')}*\n• 1-Click Settlement Link:\n${upiUrl}\n\nPlease clear this immediately to keep your PG services active.`
      }

      if (!dryRun && res.phone) {
        await sendWhatsAppMessage({
          to: res.phone,
          text: messageText,
          organizationId: res.organization_id,
          residentId: res.resident_id,
        })
      }

      results.push({
        residentId: res.resident_id,
        name: res.full_name,
        phone: res.phone,
        room: res.room_number,
        balanceInr,
        tier,
        status: dryRun ? 'simulated' : 'dispatched',
      })
    }

    return NextResponse.json({
      success: true,
      tier,
      dryRun,
      totalCount: list.length,
      dispatchedCount: results.length,
      results,
    })
  } catch (err: any) {
    console.error('Failed executing automated cadence:', err)
    return NextResponse.json({ error: err?.message || 'Cadence run failed' }, { status: 500 })
  }
}
