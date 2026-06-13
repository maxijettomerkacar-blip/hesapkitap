#!/usr/bin/env node
/**
 * Vercel env degiskenlerini API ile senkronize eder (.env.local'dan)
 * Kullanim: npm run deploy:sync-vercel
 */
import { loadEnvLocal } from '../lib/load-env';

loadEnvLocal();

const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;
const teamId = process.env.VERCEL_ORG_ID;

if (!token || !projectId) {
  console.error('VERCEL_TOKEN ve VERCEL_PROJECT_ID gerekli (.env.local)');
  process.exit(1);
}

const varsToSync = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
];

const targets = ['production', 'preview', 'development'] as const;

async function api(path: string, init?: RequestInit) {
  const url = teamId
    ? `https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${teamId}`
    : `https://api.vercel.com${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* plain text */
  }
  return { ok: res.ok, status: res.status, body };
}

async function listEnv() {
  const { ok, body } = await api(`/v9/projects/${projectId}/env`);
  if (!ok) throw new Error(`Env list failed: ${JSON.stringify(body)}`);
  return (body as { envs: Array<{ id: string; key: string; target?: string[] }> }).envs || [];
}

async function deleteEnv(id: string) {
  await api(`/v9/projects/${projectId}/env/${id}`, { method: 'DELETE' });
}

async function createEnv(key: string, value: string, target: string[]) {
  const { ok, body } = await api(`/v10/projects/${projectId}/env`, {
    method: 'POST',
    body: JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target,
    }),
  });
  if (!ok) throw new Error(`Env create ${key} failed: ${JSON.stringify(body)}`);
}

async function main() {
  console.log('Vercel env senkronizasyonu basliyor...');
  const existing = await listEnv();

  for (const key of varsToSync) {
    const value = process.env[key];
    if (!value) {
      console.log(`ATLA (bos): ${key}`);
      continue;
    }

    for (const target of targets) {
      const matches = existing.filter((e) => e.key === key && e.target?.includes(target));
      for (const env of matches) {
        await deleteEnv(env.id);
      }
      await createEnv(key, value, [target]);
      console.log(`OK: ${key} [${target}]`);
    }
  }

  console.log('\nTamamlandi. Yeni deploy icin Vercel dashboard veya git push kullanin.');
  console.log('NOT: SUPABASE_SERVICE_ROLE_KEY Vercel\'e eklenmez.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
