import { NextResponse } from 'next/server'

/**
 * Seed route disabled for production purity
 */
export async function POST() {
  return NextResponse.json(
    { message: 'Mock data seeding is disabled in production. Use Onboarding or the Check-In form to add real properties and residents.' },
    { status: 200 }
  )
}
