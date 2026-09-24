import test from 'node:test'
import assert from 'node:assert'
import {
  isProtectedSuperAdminIdentity,
  isKnownSuperAdmin,
  PROTECTED_SUPERADMIN_PHONES,
  PROTECTED_SUPERADMIN_EMAILS,
  SUPER_ADMIN_EMAILS,
} from '../src/lib/admin-identities.ts'

test('🛡️ Superadmin Identity Protection & Reservation Security Suite', async (t) => {
  await t.test('1. Blocks registration or claiming of Superadmin Phone Numbers in any format', () => {
    // 9453522757 in diverse formats
    assert.strictEqual(isProtectedSuperAdminIdentity({ phone: '9453522757' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ phone: '+919453522757' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ phone: '+91 94535 22757' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ phone: '09453522757' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ mobile: '9453522757' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ mobile: '+91-94535-22757' }), true)

    // 6307139206 in diverse formats
    assert.strictEqual(isProtectedSuperAdminIdentity({ phone: '6307139206' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ phone: '+916307139206' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ phone: '+91 63071 39206' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ phone: '06307139206' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ mobile: '6307139206' }), true)
  })

  await t.test('2. Blocks registration or claiming of Superadmin Emails in any case or whitespace', () => {
    assert.strictEqual(isProtectedSuperAdminIdentity({ email: 'vikramtomar0505@gmail.com' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ email: 'VIKRAMTOMAR0505@GMAIL.COM' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ email: ' vikramtomar0505@gmail.com ' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ email: 'vikramtomar050512@gmail.com' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ email: 'tomarsahab575@gmail.com' }), true)
    assert.strictEqual(isProtectedSuperAdminIdentity({ email: 'TOMARSAHAB575@GMAIL.COM ' }), true)
  })

  await t.test('3. Allows normal tenant and owner customer identities', () => {
    assert.strictEqual(isProtectedSuperAdminIdentity({ phone: '9876543210', email: 'user@example.com' }), false)
    assert.strictEqual(isProtectedSuperAdminIdentity({ phone: '7000000000' }), false)
    assert.strictEqual(isProtectedSuperAdminIdentity({ email: 'tenant@gmail.com' }), false)
    assert.strictEqual(isProtectedSuperAdminIdentity({ mobile: '8888888888' }), false)
    assert.strictEqual(isProtectedSuperAdminIdentity({}), false)
    assert.strictEqual(isProtectedSuperAdminIdentity(), false)
  })

  await t.test('4. Correctly validates known superadmins for administrative clearance', () => {
    assert.strictEqual(isKnownSuperAdmin('vikramtomar0505@gmail.com'), true)
    assert.strictEqual(isKnownSuperAdmin('vikramtomar050512@gmail.com'), true)
    assert.strictEqual(isKnownSuperAdmin('tomarsahab575@gmail.com'), true)
    assert.strictEqual(isKnownSuperAdmin(null, null, '7d66235b-290c-4c73-9f43-abb9711339db'), true)
    assert.strictEqual(isKnownSuperAdmin(null, null, 'e4cd9eff-2a5e-4249-9094-e1ae92e1b0e7'), true)
    assert.strictEqual(isKnownSuperAdmin(null, null, null, '9453522757'), true)
    assert.strictEqual(isKnownSuperAdmin(null, null, null, '6307139206'), true)
    assert.strictEqual(isKnownSuperAdmin(null, 'superadmin'), true)

    // Unauthorized credentials must return false
    assert.strictEqual(isKnownSuperAdmin('hacker@gmail.com', 'owner', 'random-uuid', '9999999999'), false)
  })

  await t.test('5. Verify protected lists contain exact authorized identities', () => {
    assert.ok(PROTECTED_SUPERADMIN_PHONES.includes('9453522757'))
    assert.ok(PROTECTED_SUPERADMIN_PHONES.includes('6307139206'))
    assert.ok(SUPER_ADMIN_EMAILS.includes('vikramtomar0505@gmail.com'))
    assert.ok(SUPER_ADMIN_EMAILS.includes('vikramtomar050512@gmail.com'))
    assert.ok(SUPER_ADMIN_EMAILS.includes('tomarsahab575@gmail.com'))
  })
})
