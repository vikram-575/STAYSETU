import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'

// Mock reconciliation statement records in memory for simulation
interface BankTransaction {
  id: string
  date: string
  utr: string
  description: string
  creditPaise: number
  matchedResidentId?: string
  matchedResidentName?: string
  matchedVan?: string
  matchConfidence: 'exact_van' | 'phone_match' | 'fuzzy_amount' | 'unmatched'
  status: 'pending' | 'reconciled' | 'ignored'
}

declare global {
  // eslint-disable-next-line no-var
  var __pgsetu_bank_txs__: BankTransaction[] | undefined
}

if (!global.__pgsetu_bank_txs__) {
  global.__pgsetu_bank_txs__ = [
    {
      id: 'tx_01',
      date: new Date().toISOString().split('T')[0],
      utr: 'CMS29482019482',
      description: 'NEFT CR-SETU9876543210-ARJUN VERMA-RENT',
      creditPaise: 1200000,
      matchedVan: 'SETU9876543210',
      matchedResidentName: 'Arjun Verma',
      matchConfidence: 'exact_van',
      status: 'pending',
    },
    {
      id: 'tx_02',
      date: new Date().toISOString().split('T')[0],
      utr: 'UPI/428492049281/Rohit',
      description: 'UPI/ROHIT SHARMA/PAYTM/9811223344',
      creditPaise: 850000,
      matchedResidentName: 'Rohit Sharma',
      matchConfidence: 'phone_match',
      status: 'pending',
    },
    {
      id: 'tx_03',
      date: new Date().toISOString().split('T')[0],
      utr: 'IMPS4820194820',
      description: 'IMPS-FATHER TRANSFER FOR ROOM 302',
      creditPaise: 950000,
      matchedResidentName: 'Vivek Kumar',
      matchConfidence: 'fuzzy_amount',
      status: 'pending',
    },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)

    let residents: any[] = []
    if (orgId && isValidUUID(orgId)) {
      const { data } = await serviceClient
        .from('residents')
        .select('id, full_name, phone, registration_number, room:rooms(room_number)')
        .eq('organization_id', orgId)
        .eq('status', 'active')
      if (data) residents = data
    }

    // Generate VANs for residents: Prefix SETU + 10-digit phone
    const vans = residents.map((r) => ({
      residentId: r.id,
      residentName: r.full_name,
      roomNumber: r.room?.room_number || '—',
      vanNumber: `SETU${r.phone.replace(/\D/g, '').slice(-10)}`,
      ifscCode: 'ICIC0000104',
      bankName: 'ICICI Bank Virtual CMS Desk',
      qrUpi: `upi://pay?pa=SETU${r.phone.replace(/\D/g, '').slice(-10)}@icici&pn=PGSetu`,
    }))

    const transactions = global.__pgsetu_bank_txs__ || []

    return NextResponse.json({
      success: true,
      vans,
      transactions,
      summary: {
        totalPendingCount: transactions.filter((t) => t.status === 'pending').length,
        totalReconciledCount: transactions.filter((t) => t.status === 'reconciled').length,
        totalCreditPaise: transactions.reduce((acc, t) => acc + t.creditPaise, 0),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch reconciliation data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'reconcile', txId } = body
    const transactions = global.__pgsetu_bank_txs__ || []

    if (action === 'reconcile_single') {
      const tx = transactions.find((t) => t.id === txId)
      if (tx) {
        tx.status = 'reconciled'
      }
      return NextResponse.json({ success: true, transaction: tx })
    }

    if (action === 'reconcile_all_matched') {
      transactions.forEach((t) => {
        if (t.matchConfidence !== 'unmatched') {
          t.status = 'reconciled'
        }
      })
      return NextResponse.json({ success: true, count: transactions.length })
    }

    if (action === 'simulate_upload') {
      // Simulate statement upload with 2 new transactions
      const newTx: BankTransaction = {
        id: `tx_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        utr: `UTR${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        description: body.description || 'NEFT CR-SETU9845123678-ADITYA M-RENT',
        creditPaise: Number(body.amountRupees || 7500) * 100,
        matchedVan: 'SETU9845123678',
        matchedResidentName: 'Aditya Mehta',
        matchConfidence: 'exact_van',
        status: 'pending',
      }
      transactions.unshift(newTx)
      return NextResponse.json({ success: true, transaction: newTx })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Reconciliation failed' }, { status: 500 })
  }
}
