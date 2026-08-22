import { getFirebaseRemoteConfig } from './client'

export interface PlatformConfig {
  plan_per_bed_rate: number
  electricity_unit_rate: number
  gst_percentage: number
  maintenance_mode: boolean
  enable_whatsapp_alerts: boolean
  enable_biometric_sync: boolean
}

const DEFAULT_CONFIG: PlatformConfig = {
  plan_per_bed_rate: 10,
  electricity_unit_rate: 9,
  gst_percentage: 18,
  maintenance_mode: false,
  enable_whatsapp_alerts: true,
  enable_biometric_sync: true,
}

/**
 * Fetch dynamic configuration from Firebase Remote Config
 */
export async function getPlatformRemoteConfig(): Promise<PlatformConfig> {
  const rcModule = await getFirebaseRemoteConfig()
  if (!rcModule) return DEFAULT_CONFIG

  const { rc, getValue } = rcModule

  try {
    return {
      plan_per_bed_rate: getValue(rc, 'plan_per_bed_rate').asNumber() || DEFAULT_CONFIG.plan_per_bed_rate,
      electricity_unit_rate: getValue(rc, 'electricity_unit_rate').asNumber() || DEFAULT_CONFIG.electricity_unit_rate,
      gst_percentage: getValue(rc, 'gst_percentage').asNumber() || DEFAULT_CONFIG.gst_percentage,
      maintenance_mode: getValue(rc, 'maintenance_mode').asBoolean() || DEFAULT_CONFIG.maintenance_mode,
      enable_whatsapp_alerts: getValue(rc, 'enable_whatsapp_alerts').asBoolean() || DEFAULT_CONFIG.enable_whatsapp_alerts,
      enable_biometric_sync: getValue(rc, 'enable_biometric_sync').asBoolean() || DEFAULT_CONFIG.enable_biometric_sync,
    }
  } catch (err) {
    console.warn('[Remote Config Read Error]', err)
    return DEFAULT_CONFIG
  }
}
