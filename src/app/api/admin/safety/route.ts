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
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const search = url.searchParams.get('q')?.toLowerCase()

    // 1. Complaints Triage
    let complaintsQuery = supabase
      .from('complaints')
      .select('*, organizations(id, name, city, phone), residents(id, full_name, phone, registration_number)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (status && status !== 'all') {
      complaintsQuery = complaintsQuery.eq('status', status)
    }
    if (priority && priority !== 'all') {
      complaintsQuery = complaintsQuery.eq('priority', priority)
    }

    const { data: complaintsData } = await complaintsQuery

    let filteredComplaints = (complaintsData || []).map((c: any) => ({
      id: c.id,
      organization_id: c.organization_id,
      org_name: c.organizations?.name || 'Unknown PG',
      org_city: c.organizations?.city || 'India',
      org_phone: c.organizations?.phone || '',
      resident_id: c.resident_id,
      resident_name: c.residents?.full_name || 'Resident',
      resident_phone: c.residents?.phone || '',
      registration_number: c.residents?.registration_number || 'PG-2026-N/A',
      title: c.title || 'Service Request',
      description: c.description || '',
      category: c.category || 'General',
      priority: c.priority || 'medium',
      status: c.status || 'open',
      resolution_notes: c.resolution_notes || '',
      assigned_to: c.assigned_to || 'Unassigned',
      created_at: c.created_at,
      updated_at: c.updated_at || c.created_at,
    }))

    if (search) {
      filteredComplaints = filteredComplaints.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.resident_name.toLowerCase().includes(search) ||
          c.org_name.toLowerCase().includes(search) ||
          c.registration_number.toLowerCase().includes(search)
      )
    }

    // 2. Document Verification Queue (Residents with pending KYC)
    const { data: pendingResidents } = await supabase
      .from('residents')
      .select('id, full_name, phone, email, registration_number, kyc_status, id_proof_type, id_proof_number, id_proof_url, created_at, organization_id, organizations(name, city)')
      .in('kyc_status', ['pending', 'under_review', 'rejected', 'verified'])
      .order('created_at', { ascending: false })
      .limit(50)

    const documentsQueue = (pendingResidents || []).map((r: any) => ({
      id: `doc-${r.id}`,
      resident_id: r.id,
      resident_name: r.full_name,
      registration_number: r.registration_number || `PG-2026-${r.id.slice(0, 6).toUpperCase()}`,
      phone: r.phone,
      org_name: r.organizations?.name || 'PG Partner',
      document_type: r.id_proof_type || 'Aadhaar / Gov ID',
      document_number: r.id_proof_number ? `${r.id_proof_number.slice(0, 4)} **** ****` : 'Not provided',
      document_url: r.id_proof_url || null,
      status: r.kyc_status || 'pending',
      submitted_at: r.created_at,
    }))

    // 3. Fraud & Risk Watchlist
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, city, phone, email, subscription_status, created_at')
      .limit(100)

    const orgComplaintCounts: Record<string, number> = {}
    for (const comp of complaintsData || []) {
      const orgId = comp.organization_id
      if (orgId) {
        orgComplaintCounts[orgId] = (orgComplaintCounts[orgId] || 0) + 1
      }
    }

    const fraudWatchlist = (orgs || [])
      .map((org: any) => {
        const complaintsCount = orgComplaintCounts[org.id] || 0
        let riskScore = 10
        const reasons: string[] = []

        if (complaintsCount >= 3) {
          riskScore += complaintsCount * 15
          reasons.push(`${complaintsCount} open/escalated resident complaints`)
        }
        if (!org.phone) {
          riskScore += 20
          reasons.push('Missing verified telephone contact')
        }
        if (org.subscription_status === 'suspended') {
          riskScore += 40
          reasons.push('Account previously suspended')
        }

        return {
          id: org.id,
          name: org.name,
          city: org.city || 'India',
          phone: org.phone,
          risk_level: riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
          risk_score: Math.min(100, riskScore),
          reasons,
          created_at: org.created_at,
        }
      })
      .filter((item) => item.risk_level !== 'low')
      .sort((a, b) => b.risk_score - a.risk_score)

    return NextResponse.json({
      success: true,
      complaints: filteredComplaints,
      documentsQueue,
      fraudWatchlist,
      counts: {
        totalComplaints: filteredComplaints.length,
        openComplaints: filteredComplaints.filter((c) => c.status === 'open' || c.status === 'in_progress').length,
        pendingDocuments: documentsQueue.filter((d) => d.status === 'pending' || d.status === 'under_review').length,
        flaggedRisks: fraudWatchlist.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch safety data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireSuperAdmin(request)
    if (!adminUser) return NextResponse.json({ error: 'Super Admin access required.' }, { status: 403 })

    const supabase = await createServiceClient()
    const body = await request.json()
    const { action } = body

    if (action === 'update_complaint') {
      const { complaint_id, status, priority, assigned_to, resolution_notes } = body
      if (!complaint_id) {
        return NextResponse.json({ error: 'complaint_id is required' }, { status: 400 })
      }

      const updates: Record<string, any> = { updated_at: new Date().toISOString() }
      if (status) updates.status = status
      if (priority) updates.priority = priority
      if (assigned_to !== undefined) updates.assigned_to = assigned_to
      if (resolution_notes !== undefined) updates.resolution_notes = resolution_notes

      const { data: updated, error } = await supabase
        .from('complaints')
        .update(updates)
        .eq('id', complaint_id)
        .select()
        .single()

      if (error) throw error

      try {
        await supabase.from('audit_logs').insert({
          organization_id: updated.organization_id,
          action: 'update',
          entity_type: 'complaint',
          entity_id: complaint_id,
          after_state: updates,
        })
      } catch {}

      return NextResponse.json({ success: true, complaint: updated, message: 'Complaint updated successfully' })
    }

    if (action === 'moderate_document') {
      const { resident_id, kyc_status, rejection_reason } = body
      if (!resident_id || !kyc_status) {
        return NextResponse.json({ error: 'resident_id and kyc_status are required' }, { status: 400 })
      }

      const { data: updatedResident, error } = await supabase
        .from('residents')
        .update({
          kyc_status,
          notes: rejection_reason ? `KYC Rejected: ${rejection_reason}` : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resident_id)
        .select('id, full_name, kyc_status, organization_id')
        .single()

      if (error) throw error

      try {
        await supabase.from('audit_logs').insert({
          organization_id: updatedResident.organization_id,
          action: 'update',
          entity_type: 'resident_kyc',
          entity_id: resident_id,
          after_state: { kyc_status, rejection_reason },
        })
      } catch {}

      return NextResponse.json({ success: true, resident: updatedResident, message: `Document marked as ${kyc_status}` })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to process safety action' }, { status: 500 })
  }
}
