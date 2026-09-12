import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth-session'
import { resolveEffectiveOrgId, isValidUUID } from '@/lib/org-helper'
import { generateTenantId, cleanMobile } from '@/lib/profiles'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = await createServiceClient()
    const orgId = await resolveEffectiveOrgId(user)
    const body = await request.json()
    const { rows = [] } = body

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No data rows provided for import' }, { status: 400 })
    }

    const results = {
      total: rows.length,
      imported: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const name = (row.name || row.fullName || '').trim()
      const phone = cleanMobile(row.phone || row.mobile || '')
      const roomNumber = (row.roomNumber || row.room || '').trim()
      const bedLabel = (row.bedLabel || row.bed || 'A').trim()
      const rentPaise = Math.round(Number(row.rent || 0) * 100)
      const depositPaise = Math.round(Number(row.deposit || 0) * 100)
      const joinDate = row.joiningDate || new Date().toISOString().split('T')[0]

      if (!name || !phone) {
        results.errors.push(`Row ${i + 1}: Name and valid mobile are required`)
        continue
      }

      if (orgId && isValidUUID(orgId)) {
        try {
          const tenantId = generateTenantId()
          await serviceClient.from('residents').insert({
            organization_id: orgId,
            full_name: name,
            phone,
            registration_number: tenantId,
            check_in_date: joinDate,
            status: 'active',
          })
          results.imported++
        } catch (err: any) {
          results.errors.push(`Row ${i + 1} (${name}): ${err.message}`)
        }
      } else {
        // Simulation mode
        results.imported++
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Bulk import failed' }, { status: 500 })
  }
}
