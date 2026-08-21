import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET/POST /api/admin/init-superadmin
 * Provisions Super Admin: vikramtomar0505@gmail.com / qwerty123
 */
export async function GET() {
  return handleInitSuperAdmin()
}

export async function POST() {
  return handleInitSuperAdmin()
}

async function handleInitSuperAdmin() {
  const superAdminEmail = 'vikramtomar0505@gmail.com'
  const superAdminPass = 'qwerty123'
  const superAdminName = 'Vikram Tomar'

  let supabaseCreated = false
  try {
    const supabase = await createServiceClient()

    // Check if user exists in Supabase
    const { data: usersList } = await supabase.auth.admin.listUsers()
    const existingUser = usersList?.users?.find((u) => u.email?.toLowerCase() === superAdminEmail.toLowerCase())

    let supabaseUserId = existingUser?.id

    if (!supabaseUserId) {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: superAdminEmail,
        password: superAdminPass,
        email_confirm: true,
        user_metadata: { full_name: superAdminName, role: 'superadmin' },
      })
      if (!createErr && newUser?.user) {
        supabaseUserId = newUser.user.id
        supabaseCreated = true
      }
    } else {
      await supabase.auth.admin.updateUserById(supabaseUserId, {
        password: superAdminPass,
        user_metadata: { full_name: superAdminName, role: 'superadmin' },
      })
    }

    // Upsert into users table
    if (supabaseUserId) {
      // Get or create primary organization
      let { data: primaryOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()

      if (!primaryOrg) {
        const { data: newOrg } = await supabase
          .from('organizations')
          .insert({
            name: 'PG-SETU Platform Enterprise',
            slug: 'pgsetu-enterprise',
            settings: { plan: 'enterprise', subscription_status: 'active' },
          })
          .select('id')
          .single()
        primaryOrg = newOrg
      }

      await supabase.from('users').upsert({
        id: supabaseUserId,
        organization_id: primaryOrg?.id || null,
        email: superAdminEmail,
        full_name: superAdminName,
        role: 'superadmin',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
    }
  } catch (err: any) {
    console.error('Super Admin setup warning:', err?.message)
  }

  return NextResponse.json({
    success: true,
    message: 'Super Admin successfully provisioned and configured.',
    credentials: {
      email: superAdminEmail,
      role: 'superadmin',
      login_url: '/login',
      admin_panel_url: '/admin',
    },
  })
}
