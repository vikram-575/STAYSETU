import { NextResponse } from 'next/server'

/**
 * Seed endpoint disabled to prevent accidental insertion of mock / fake data.
 * All properties and tenants are managed via authentic onboarding and checkout workflows.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Seed endpoint disabled to protect real tenant, owner, and property data.' },
    { status: 403 }
  )
}
