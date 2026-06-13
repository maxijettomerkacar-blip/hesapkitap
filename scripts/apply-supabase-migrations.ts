#!/usr/bin/env node
/**
 * supabase/migrations/*.sql dosyalarini gerekirse uygular.
 * Oncelik: SUPABASE_ACCESS_TOKEN (Management API) veya DATABASE_URL (postgres)
 */
import { createHash } from 'crypto';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { loadEnvLocal } from '../lib/load-env';

loadEnvLocal();

const migrationsDir = resolve(process.cwd(), 'supabase/migrations');

function migrationHash(): string {
  if (!existsSync(migrationsDir)) return '';
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const content = files.map((f) => readFileSync(resolve(migrationsDir, f), 'utf-8')).join('\n');
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

function projectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!m) throw new Error('NEXT_PUBLIC_SUPABASE_URL gecersiz');
  return m[1];
}

async function getStoredHash(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(`${url}/rest/v1/app_settings?key=eq.schema_migration_hash&select=value`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as { value: string }[];
  return rows[0]?.value ?? null;
}

async function saveHash(hash: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) return;
  await fetch(`${url}/rest/v1/app_settings`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ key: 'schema_migration_hash', value: hash }),
  });
}

async function applyViaManagementApi(sql: string): Promise<void> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN yok');
  const ref = projectRef();
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase Management API: ${res.status} ${body.slice(0, 200)}`);
  }
}

async function main() {
  const hash = migrationHash();
  if (!hash) {
    console.log('INFO Supabase migration dosyasi yok — atlandi');
    return;
  }

  const stored = await getStoredHash();
  if (stored === hash) {
    console.log('OK Supabase migration guncel (hash eslesiyor)');
    return;
  }

  console.log('INFO Supabase migration degisti — uygulaniyor...');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const sql = files.map((f) => readFileSync(resolve(migrationsDir, f), 'utf-8')).join('\n\n');

  let applied = false;
  try {
    if (process.env.SUPABASE_ACCESS_TOKEN) {
      await applyViaManagementApi(sql);
      applied = true;
      console.log('OK Migration Management API ile uygulandi');
    }
  } catch (e) {
    console.warn('Migration API hatasi:', e instanceof Error ? e.message : e);
  }

  if (!applied) {
    console.warn('UYARI: Otomatik SQL calistirilamadi.');
    console.warn('  Secenek A: .env.local → SUPABASE_ACCESS_TOKEN (supabase.com/dashboard/account/tokens)');
    console.warn('  Secenek B: .env.local → DATABASE_URL (Supabase → Settings → Database)');
    console.warn('  Secenek C: SQL Editor\'de supabase/migrations/002_motor_tracking.sql calistirin');
    console.warn('  Tablolar zaten varsa deploy devam edebilir.');
  } else {
    console.log('OK Migration uygulandi');
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await saveHash(hash);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
