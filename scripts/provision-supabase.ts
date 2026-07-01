#!/usr/bin/env node
/**
 * Silinen / erisilemeyen Supabase projesini yeniden kurar.
 * Gereksinim: makinede `npx supabase login` yapilmis olmali.
 *
 * Kullanim: npm run supabase:provision
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { createHash, randomBytes } from 'crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { loadEnvLocal } from '../lib/load-env';

const PROJECT_NAME = 'maxi-hesaplama';
const ORG_ID = 'bhthmotpevvatiammgox';
const REGION = 'eu-central-1';
const ADMIN_EMAIL = 'maxijett.omerkacar@gmail.com';
const APP_URL = 'https://hesapkitap-git-main-omer-sqwqw-projects.vercel.app';

function runJson<T>(cmd: string): T {
  const out = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  return JSON.parse(out) as T;
}

function run(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function randomPassword(length = 24): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function upsertEnvLocal(updates: Record<string, string>) {
  const envPath = resolve(process.cwd(), '.env.local');
  const lines = existsSync(envPath) ? readFileSync(envPath, 'utf-8').split('\n') : [];
  const keys = new Set(Object.keys(updates));
  const kept: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      kept.push(line);
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      kept.push(line);
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (keys.has(key)) continue;
    kept.push(line);
  }

  while (kept.length > 0 && kept[kept.length - 1] === '') kept.pop();

  const block = Object.entries(updates).map(([k, v]) => `${k}=${v}`);
  const next = [...kept, '', '# --- Supabase (otomatik provision) ---', ...block, ''].join('\n');
  writeFileSync(envPath, next, 'utf-8');
}

async function waitForHealthy(ref: string, maxAttempts = 40) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      const projects = runJson<Array<{ ref: string; status: string }>>(
        'npx supabase@latest projects list -o json',
      );
      const project = projects.find((p) => p.ref === ref);
      if (project?.status === 'ACTIVE_HEALTHY') {
        console.log(`OK Proje hazir (${ref})`);
        return;
      }
      console.log(`INFO Proje bekleniyor... (${i}/${maxAttempts}) status=${project?.status ?? 'unknown'}`);
    } catch (e) {
      console.log(`INFO Durum kontrolu (${i}/${maxAttempts})`, e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error(`Proje ${maxAttempts} denemede hazir olmadi`);
}

async function applyMigrations(projectRef: string, serviceKey: string, url: string) {
  const migrationsDir = resolve(process.cwd(), 'supabase/migrations');
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const sql = files.map((f) => readFileSync(resolve(migrationsDir, f), 'utf-8')).join('\n\n');

  const tmp = resolve(process.cwd(), '.supabase-provision.sql');
  writeFileSync(tmp, sql, 'utf-8');
  try {
    run(`npx supabase@latest link --project-ref ${projectRef} --yes`);
    run(`npx supabase@latest db query --linked --file "${tmp}"`);
    console.log('OK Migration SQL uygulandi');
  } finally {
    try {
      execSync(`del /f /q "${tmp}"`, { stdio: 'ignore' });
    } catch {
      /* ignore */
    }
  }

  const hash = createHash('sha256').update(sql).digest('hex').slice(0, 16);
  await fetch(`${url}/rest/v1/app_settings`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ key: 'schema_migration_hash', value: hash }),
  });
}

async function configureAuth(url: string, serviceKey: string) {
  const redirectUrls = [
    'http://localhost:3000/auth/callback',
    `${APP_URL}/auth/callback`,
  ];
  const res = await fetch(`${url}/auth/v1/settings`, {
    method: 'PUT',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      site_url: APP_URL,
      uri_allow_list: redirectUrls.join(','),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.warn(`UYARI Auth URL ayari: HTTP ${res.status} ${body.slice(0, 120)}`);
    return;
  }
  console.log('OK Auth redirect URL ayarlandi');
}

async function ensureAdminUser(url: string, serviceKey: string, password: string) {
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`Admin listesi: ${error.message}`);

  const existing = data.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (existing) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: { ...existing.app_metadata, role: 'full' },
    });
    if (updateError) throw new Error(`Admin guncelleme: ${updateError.message}`);
    console.log(`OK Admin kullanici guncellendi: ${ADMIN_EMAIL}`);
    return;
  }

  const { error: createError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password,
    email_confirm: true,
    app_metadata: { role: 'full' },
  });
  if (createError) throw new Error(`Admin olusturma: ${createError.message}`);
  console.log(`OK Admin kullanici olusturuldu: ${ADMIN_EMAIL}`);
}

async function main() {
  console.log('=== Supabase Provision ===\n');

  const projects = runJson<Array<{ ref: string; name: string; status: string }>>(
    'npx supabase@latest projects list -o json',
  );

  let project = projects.find((p) => p.name === PROJECT_NAME);
  if (!project) {
    console.log(`INFO Yeni proje olusturuluyor: ${PROJECT_NAME}`);
    const dbPassword = randomPassword(28);
    project = runJson<{ ref: string; name: string; status: string }>(
      `npx supabase@latest projects create ${PROJECT_NAME} --org-id ${ORG_ID} --db-password "${dbPassword}" --region ${REGION} -o json`,
    );
    upsertEnvLocal({ SUPABASE_DB_PASSWORD: dbPassword });
    console.log(`OK Proje olusturuldu: ${project.ref}`);
  } else {
    console.log(`OK Mevcut proje kullaniliyor: ${project.ref} (${project.status})`);
  }

  await waitForHealthy(project.ref);

  const keys = runJson<
    Array<{ name: string; api_key: string; type?: string }>
  >(`npx supabase@latest projects api-keys --project-ref ${project.ref} --reveal -o json`);

  const anon = keys.find((k) => k.name === 'anon')?.api_key;
  const service = keys.find((k) => k.name === 'service_role')?.api_key;
  if (!anon || !service) {
    throw new Error('API anahtarlari alinamadi (anon / service_role)');
  }

  const url = `https://${project.ref}.supabase.co`;
  const adminPassword = randomPassword(20);

  upsertEnvLocal({
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
    SUPABASE_SERVICE_ROLE_KEY: service,
    NEXT_PUBLIC_APP_URL: APP_URL,
    VERCEL_URL: APP_URL,
    INITIAL_ADMIN_EMAIL: ADMIN_EMAIL,
    INITIAL_ADMIN_PASSWORD: adminPassword,
  });

  loadEnvLocal();
  console.log('OK .env.local guncellendi');

  await applyMigrations(project.ref, service, url);
  await configureAuth(url, service);
  await ensureAdminUser(url, service, adminPassword);

  console.log('\n=== Provision tamamlandi ===');
  console.log(`Supabase URL: ${url}`);
  console.log(`Admin e-posta: ${ADMIN_EMAIL}`);
  console.log('Admin sifre: .env.local → INITIAL_ADMIN_PASSWORD');
  console.log('\nSonraki adim: npm run release');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
