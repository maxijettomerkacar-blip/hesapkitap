import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'maintenance-receipts';

export async function uploadMaintenanceReceipt(
  supabase: SupabaseClient,
  motorId: string,
  maintenanceId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${motorId}/${maintenanceId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function deleteMaintenanceReceipt(
  supabase: SupabaseClient,
  path: string,
): Promise<void> {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
