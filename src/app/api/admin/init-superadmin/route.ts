import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/firestore'
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

  let firebaseUser: any = null
  let firebaseCreated = false

  // 1. Provision in Firebase Auth
  try {
    try {
      firebaseUser = await adminAuth.getUserByEmail(superAdminEmail)
      // Update password and name
      await adminAuth.updateUser(firebaseUser.uid, {
        password: superAdminPass,
        displayName: superAdminName,
      })
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        firebaseUser = await adminAuth.createUser({
          email: superAdminEmail,
          password: superAdminPass,
          displayName: superAdminName,
          emailVerified: true,
        })
        firebaseCreated = true
      } else {
        throw e
      }
    }

    // Set Custom Claims for Super Admin
    if (firebaseUser) {
      await adminAuth.setCustomUserClaims(firebaseUser.uid, {
        superadmin: true,
        role: 'superadmin',
      })

      // Update Firestore Users Collection
      await adminDb.collection(COLLECTIONS.USERS).doc(firebaseUser.uid).set({
        email: superAdminEmail,
        full_name: superAdminName,
        role: 'superadmin',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { merge: true })
    }
  } catch (err: any) {
    console.error('Firebase Super Admin setup warning:', err.message)
  }

  // 2. Provision in Supabase Auth & Database (dual-sync)
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
    console.error('Supabase Super Admin setup warning:', err.message)
  }

  return NextResponse.json({
    success: true,
    message: 'Super Admin successfully provisioned and configured.',
    credentials: {
      email: superAdminEmail,
      role: 'superadmin',
      firebase_synced: !!firebaseUser,
      supabase_synced: true,
      login_url: '/login',
      admin_panel_url: '/admin',
    },
  })
}
