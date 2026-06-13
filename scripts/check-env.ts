#!/usr/bin/env node
/**
 * .env.local icindeki zorunlu degiskenleri kontrol eder.
 * Kullanim: npm run env:check
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!existsSync(envPath)) {
  console.error('HATA: .env.local bulunamadi.');
  console.error('  copy .env.local.example .env.local');
  console.error('  SETUP_SUPABASE_VERCEL.md adimlarini takip edin.');
  process.exit(1);
}

const content = readFileSync(envPath, 'utf-8');
const vars: Record<string, string> = {};

for (const line of content.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim();
  vars[key] = val;
}

let ok = true;
for (const key of required) {
  const val = vars[key];
  if (!val || val.includes('your-') || val === '') {
    console.error(`EKSIK: ${key}`);
    ok = false;
  } else {
    console.log(`OK: ${key} (${val.slice(0, 30)}...)`);
  }
}

const optional = vars['SUPABASE_SERVICE_ROLE_KEY'];
if (optional) {
  console.log('OK: SUPABASE_SERVICE_ROLE_KEY (import script icin)');
} else {
  console.log('BILGI: SUPABASE_SERVICE_ROLE_KEY yok — import script calismaz, uygulama calisir');
}

if (!ok) {
  console.error('\nSETUP_SUPABASE_VERCEL.md dosyasina bakin.');
  process.exit(1);
}

console.log('\nOrtam degiskenleri hazir. npm run dev ile baslatabilirsiniz.');
