import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient()

    const { data: users, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, role, is_active, last_login_at, created_at, organization_id, organizations(name, slug)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      users: users || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch platform users' }, { status: 500 })
  }
}
