import { NextResponse, type NextRequest } from 'next/server'
import { getDiditSessionDecision } from '@/lib/didit'

/**
 * GET /api/v1/didit/session-status?sessionId=<id>
 * Checks status and fetches extracted document & facial verification results from Didit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId query parameter is required' }, { status: 400 })
    }

    const { decision, extracted } = await getDiditSessionDecision(sessionId)

    return NextResponse.json({
      success: true,
      status: extracted.status,
      is_approved: extracted.isApproved,
      is_pending: extracted.isPending,
      is_declined: extracted.isDeclined,
      extracted_data: extracted,
      decision,
    })
  } catch (err: any) {
    console.error('[Didit Session Status Error]:', err)
    return NextResponse.json(
      { error: err.message || 'Failed to fetch Didit session status' },
      { status: 500 }
    )
  }
}
