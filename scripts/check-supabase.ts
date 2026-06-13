#!/usr/bin/env node
/**
 * Supabase baglanti ve tablo kontrolu.
 * Kullanim: npm run infra:check
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnv(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env.local');
  const vars: Record<string, string> = {};
  if (!existsSync(envPath)) return vars;
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return vars;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const appUrl = env.NEXT_PUBLIC_APP_URL;

if (!url || !anonKey) {
  console.error('HATA: NEXT_PUBLIC_SUPABASE_URL ve ANON_KEY gerekli (.env.local)');
  process.exit(1);
}

const headers = {
  apikey: anonKey,
  Authorization: `Bearer ${anonKey}`,
};

const tables = [
  'businesses',
  'table_entries',
  'saved_reports',
  'regions',
  'app_settings',
  'couriers',
  'motors',
  'motor_maintenance',
];

async function checkTable(name: string): Promise<boolean> {
  const res = await fetch(`${url}/rest/v1/${name}?select=*&limit=1`, { headers });
  if (res.ok) {
    console.log(`OK: tablo "${name}" erisilebilir`);
    return true;
  }
  const body = await res.text();
  console.error(`HATA: tablo "${name}" — ${res.status} ${body.slice(0, 120)}`);
  return false;
}

async function main() {
  console.log('Supabase URL:', url);
  let ok = true;
  for (const t of tables) {
    if (!(await checkTable(t))) ok = false;
  }

  if (appUrl) {
    const callback = `${appUrl.replace(/\/$/, '')}/auth/callback`;
    console.log('\nSupabase Auth Redirect URL (panelde olmali):');
    console.log(' ', callback);
    console.log('  Dashboard → Authentication → URL Configuration → Redirect URLs');
  }

  if (!ok) {
    console.error('\nMigration calistirildi mi? supabase/migrations/001_initial_schema.sql');
    process.exit(1);
  }
  console.log('\nSupabase altyapisi hazir.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
