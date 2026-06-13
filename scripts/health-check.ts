#!/usr/bin/env node
/**
 * Git + Supabase + Vercel saglik kontrolu
 * Kullanim: npm run deploy:check
 */
import { execSync } from 'child_process';
import { loadEnvLocal } from '../lib/load-env';

loadEnvLocal();

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const optional = ['VERCEL_URL', 'VERCEL_TOKEN', 'SUPABASE_SERVICE_ROLE_KEY'];

let failed = false;

function ok(msg: string) {
  console.log(`OK  ${msg}`);
}

function fail(msg: string) {
  console.error(`FAIL ${msg}`);
  failed = true;
}

function info(msg: string) {
  console.log(`INFO ${msg}`);
}

async function checkSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const tables = ['businesses', 'regions', 'saved_reports', 'table_entries', 'app_settings'];
  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (res.status === 200) {
        ok(`Supabase tablo erisilebilir: ${table}`);
      } else {
        const body = await res.text();
        fail(`Supabase ${table}: HTTP ${res.status} — ${body.slice(0, 120)}`);
      }
    } catch (e) {
      fail(`Supabase ${table}: ${e instanceof Error ? e.message : e}`);
    }
  }

  const authRes = await fetch(`${url}/auth/v1/health`, {
    headers: { apikey: key },
  });
  if (authRes.ok) {
    ok('Supabase Auth servisi yanit veriyor');
  } else {
    fail(`Supabase Auth: HTTP ${authRes.status}`);
  }
}

async function checkVercel() {
  const vercelUrl = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!vercelUrl) {
    info('VERCEL_URL tanimli degil — Vercel kontrolu atlandi');
    return;
  }

  const base = vercelUrl.replace(/\/$/, '');
  for (const path of ['/', '/login']) {
    try {
      const res = await fetch(`${base}${path}`, { redirect: 'follow' });
      if (res.ok || res.status === 307 || res.status === 308) {
        ok(`Vercel ${path} → HTTP ${res.status}`);
      } else if (res.status === 401 || res.status === 403) {
        info(`Vercel ${path} → HTTP ${res.status} (Deployment Protection acik olabilir)`);
      } else {
        fail(`Vercel ${path} → HTTP ${res.status}`);
      }
    } catch (e) {
      fail(`Vercel ${path}: ${e instanceof Error ? e.message : e}`);
    }
  }

  if (process.env.VERCEL_TOKEN) {
    const res = await fetch('https://api.vercel.com/v2/user', {
      headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
    });
    if (res.ok) {
      ok('Vercel API token gecerli');
    } else {
      fail(`Vercel API token: HTTP ${res.status}`);
    }
  } else {
    info('VERCEL_TOKEN yok — Vercel API kontrolu atlandi');
  }
}

function checkGit() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    ok(`Git branch: ${branch}`);
    ok(`Git remote: ${remote}`);
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
    if (status) {
      info('Git working tree kirli (commit edilmemis degisiklik var)');
    } else {
      ok('Git working tree temiz');
    }
  } catch {
    info('Git repo bulunamadi veya git yok');
  }
}

function checkLocalEnv() {
  for (const key of required) {
    const val = process.env[key];
    if (!val) {
      fail(`Eksik: ${key}`);
    } else {
      ok(`${key} tanimli`);
    }
  }
  for (const key of optional) {
    if (process.env[key]) {
      ok(`${key} tanimli`);
    }
  }
}

async function main() {
  console.log('=== MaxiHesaplama Deploy Check ===\n');
  checkLocalEnv();
  console.log('');
  checkGit();
  console.log('');
  await checkSupabase();
  console.log('');
  await checkVercel();
  console.log('');

  if (failed) {
    console.error('Bazi kontroller basarisiz.');
    process.exit(1);
  }
  console.log('Tum kontroller gecti.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
