#!/usr/bin/env node
/** Vercel proje ayarlarini duzeltir ve redeploy tetikler */
import { loadEnvLocal } from '../lib/load-env';

loadEnvLocal();

const token = process.env.VERCEL_TOKEN!;
const projectId = process.env.VERCEL_PROJECT_ID!;
const teamId = process.env.VERCEL_ORG_ID!;

async function api(path: string, init?: RequestInit) {
  const url = `https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${teamId}`;
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
    /* */
  }
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  console.log('Vercel proje ayarlari guncelleniyor...');

  const patch = await api(`/v9/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      framework: 'nextjs',
      outputDirectory: null,
      buildCommand: null,
      installCommand: null,
      devCommand: null,
      ssoProtection: null,
    }),
  });

  if (!patch.ok) {
    console.error('PATCH failed:', patch.status, patch.body);
    process.exit(1);
  }

  const p = patch.body as { framework?: string; ssoProtection?: unknown };
  console.log('OK framework:', p.framework);
  console.log('OK ssoProtection:', p.ssoProtection ?? 'disabled');

  console.log('Redeploy tetikleniyor...');
  const deploy = await api(`/v13/deployments`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'hesapkitap',
      project: projectId,
      target: 'production',
      gitSource: {
        type: 'github',
        repo: 'hesapkitap',
        ref: 'main',
        org: 'maxijettomerkacar-blip',
      },
    }),
  });

  if (!deploy.ok) {
    console.warn('Git deploy tetiklenemedi:', deploy.status, deploy.body);
    console.log('Vercel dashboard uzerinden Redeploy yapin veya git push gonderin.');
    return;
  }

  const d = deploy.body as { url?: string; id?: string };
  console.log('Deploy baslatildi:', d.url || d.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
