import { createServiceClient } from '@/lib/supabase/server'
import { KYCAuditLogEntry } from './types'

/**
 * Record an immutable KYC Audit Log entry
 */
export async function logKYCEvent(params: {
  organization_id: string
  tenant_id?: string
  kyc_id?: string
  event: KYCAuditLogEntry['event']
  actor: string
  metadata?: Record<string, any>
}): Promise<KYCAuditLogEntry> {
  const entry: KYCAuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    organization_id: params.organization_id,
    tenant_id: params.tenant_id,
    kyc_id: params.kyc_id,
    event: params.event,
    actor: params.actor,
    timestamp: new Date().toISOString(),
    metadata: params.metadata || {},
  }

  try {
    const supabase = await createServiceClient()
    await supabase.from('kyc_audit_logs').insert({
      organization_id: params.organization_id,
      tenant_id: params.tenant_id || null,
      kyc_id: params.kyc_id || null,
      event: params.event,
      actor: params.actor,
      metadata: params.metadata || {},
      created_at: entry.timestamp,
    })
  } catch (err) {
    // If Supabase table isn't migrated yet, gracefully log in console without blocking execution
    console.info('[KYC Audit Event]:', params.event, params.actor, params.metadata)
  }

  return entry
}

/**
 * Fetch all audit entries for a KYC record
 */
export async function getKYCAuditLogs(kycId: string, orgId: string): Promise<KYCAuditLogEntry[]> {
  try {
    const supabase = await createServiceClient()
    const { data } = await supabase
      .from('kyc_audit_logs')
      .select('*')
      .eq('kyc_id', kycId)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })

    if (data && data.length > 0) {
      return data.map((d) => ({
        id: d.id,
        organization_id: d.organization_id,
        tenant_id: d.tenant_id,
        kyc_id: d.kyc_id,
        event: d.event,
        actor: d.actor,
        timestamp: d.created_at || d.timestamp,
        metadata: d.metadata || {},
      }))
    }
  } catch (err) {
    console.warn('[KYC Audit Fetch Warn]:', err)
  }

  return []
}
