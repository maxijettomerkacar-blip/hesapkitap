#!/usr/bin/env node
/**
 * Vercel proje ayarlarini duzeltir (framework nextjs, protection kapali)
 * Kullanim:
 *   npm run deploy:fix-vercel          # ayar duzelt + redeploy
 *   npm run deploy:fix-vercel -- --no-redeploy   # sadece ayar (verify icin)
 */
import { loadEnvLocal } from '../lib/load-env';

loadEnvLocal();

const noRedeploy = process.argv.includes('--no-redeploy');

const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;
const teamId = process.env.VERCEL_ORG_ID;

if (!token || !projectId) {
  console.error('VERCEL_TOKEN ve VERCEL_PROJECT_ID .env.local icinde olmali');
  process.exit(1);
}

async function api(path: string, init?: RequestInit) {
  const sep = path.includes('?') ? '&' : '?';
  const url = teamId
    ? `https://api.vercel.com${path}${sep}teamId=${teamId}`
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
    /* */
  }
  return { ok: res.ok, status: res.status, body };
}

type ProjectInfo = {
  framework?: string | null;
  ssoProtection?: unknown;
  outputDirectory?: string | null;
};

function needsFix(project: ProjectInfo): boolean {
  if (project.framework !== 'nextjs') return true;
  if (project.outputDirectory) return true;
  if (project.ssoProtection != null) return true;
  return false;
}

async function main() {
  const get = await api(`/v9/projects/${projectId}`);
  if (!get.ok) {
    console.error('Proje okunamadi:', get.status, get.body);
    process.exit(1);
  }

  const current = get.body as ProjectInfo;

  if (!needsFix(current)) {
    console.log('OK Vercel ayarlari zaten dogru (nextjs, protection kapali)');
    if (!noRedeploy) {
      console.log('INFO Redeploy atlandi — ayar degisikligi yok');
    }
    return;
  }

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

  const p = patch.body as ProjectInfo;
  console.log('OK framework:', p.framework);
  console.log('OK ssoProtection:', p.ssoProtection ?? 'disabled');

  if (noRedeploy) {
    console.log('INFO --no-redeploy: redeploy atlandi');
    return;
  }

  console.log('Redeploy tetikleniyor...');
  const deploy = await api('/v13/deployments', {
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
    console.log('Manuel redeploy veya git push gerekebilir.');
    return;
  }

  const d = deploy.body as { url?: string; id?: string };
  console.log('Deploy baslatildi:', d.url || d.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
