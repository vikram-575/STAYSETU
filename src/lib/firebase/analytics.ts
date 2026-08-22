import { logEvent as fbLogEvent } from 'firebase/analytics'
import { getFirebaseAnalytics } from './client'

/**
 * Log custom Firebase Analytics Event
 */
export async function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  try {
    const analytics = await getFirebaseAnalytics()
    if (analytics) {
      fbLogEvent(analytics, eventName, eventParams)
    }
  } catch (err: any) {
    console.warn('[Analytics Error]', err?.message)
  }
}

// Business Action Analytics Helpers
export const AnalyticsEvents = {
  // Onboarding
  PG_ONBOARDING_STARTED: 'pg_onboarding_started',
  PG_ONBOARDING_COMPLETED: 'pg_onboarding_completed',

  // Residents
  RESIDENT_CHECKIN: 'resident_checkin',
  RESIDENT_CHECKOUT: 'resident_checkout',
  RESIDENT_ROOM_TRANSFER: 'resident_room_transfer',

  // Financials
  INVOICE_GENERATED: 'invoice_generated',
  RENT_COLLECTED: 'rent_collected',
  EXPENSE_LOGGED: 'expense_logged',

  // Electricity
  METER_READING_RECORDED: 'meter_reading_recorded',

  // Super Admin
  SUPERADMIN_LOGIN: 'superadmin_login',
  USER_CREATED: 'user_created',
} as const

export async function logRentCollected(amountPaise: number, mode: string, orgId: string) {
  trackEvent(AnalyticsEvents.RENT_COLLECTED, {
    value: amountPaise / 100,
    currency: 'INR',
    payment_mode: mode,
    org_id: orgId,
  })
}

export async function logResidentCheckin(orgId: string, roomType: string) {
  trackEvent(AnalyticsEvents.RESIDENT_CHECKIN, {
    org_id: orgId,
    room_type: roomType,
  })
}
