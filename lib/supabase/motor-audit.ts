import type { SupabaseClient } from '@supabase/supabase-js';
import { generateId } from '../formatters';
import type { MotorAuditLog, MotorAuditUser } from '../types';

export async function getMotorAuditUser(supabase: SupabaseClient): Promise<MotorAuditUser> {
  const { data } = await supabase.auth.getUser();
  return {
    id: data.user?.id ?? '',
    email: data.user?.email ?? 'bilinmiyor',
  };
}

export async function logMotorAudit(
  supabase: SupabaseClient,
  params: {
    entityType: string;
    entityId: string;
    action: string;
    summary: string;
    details?: Record<string, unknown>;
    user?: MotorAuditUser;
  },
): Promise<void> {
  const actor = params.user ?? (await getMotorAuditUser(supabase));
  const { error } = await supabase.from('motor_audit_log').insert({
    id: generateId(),
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    summary: params.summary,
    details: params.details ?? {},
    user_email: actor.email,
    user_id: actor.id,
  });
  if (error) {
    console.warn('Audit log yazilamadi:', error.message);
  }
}

export async function fetchMotorAuditLog(
  supabase: SupabaseClient,
  limit = 50,
): Promise<MotorAuditLog[]> {
  const { data, error } = await supabase
    .from('motor_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    summary: row.summary ?? '',
    details: (row.details as Record<string, unknown>) ?? {},
    userEmail: row.user_email ?? '',
    userId: row.user_id ?? '',
    createdAt: row.created_at,
  }));
}
