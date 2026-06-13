#!/usr/bin/env node
/**
 * Production deploy — GitHub bagimsiz yerel kodu Vercel'e yukler.
 * Release pipeline: git push basarisiz olsa bile canli site guncellenir.
 */
import { execSync } from 'child_process';
import { loadEnvLocal } from '../lib/load-env';

loadEnvLocal();

const token = process.env.VERCEL_TOKEN;
const projectId = process.env.VERCEL_PROJECT_ID;
const orgId = process.env.VERCEL_ORG_ID;

if (!token) {
  console.error('VERCEL_TOKEN .env.local icinde olmali');
  process.exit(1);
}

async function deployViaGitHub(): Promise<boolean> {
  if (!projectId) return false;
  const sep = orgId ? `?teamId=${orgId}` : '';
  const res = await fetch(`https://api.vercel.com/v13/deployments${sep}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
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
  if (!res.ok) {
    const body = await res.text();
    console.warn('GitHub kaynakli deploy basarisiz:', res.status, body.slice(0, 200));
    return false;
  }
  const d = (await res.json()) as { url?: string; id?: string };
  console.log('OK GitHub kaynakli deploy:', d.url || d.id);
  return true;
}

function deployViaCli() {
  console.log('Yerel kod Vercel production deploy...');
  const env = {
    ...process.env,
    VERCEL_ORG_ID: orgId || '',
    VERCEL_PROJECT_ID: projectId || '',
  };
  execSync('npx --yes vercel@latest deploy --prod --yes', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env,
  });
  console.log('OK Yerel production deploy tamamlandi');
}

async function main() {
  const mode = process.argv.includes('--local-only')
    ? 'local'
    : process.argv.includes('--git-only')
      ? 'git'
      : 'auto';

  if (mode === 'local') {
    deployViaCli();
    return;
  }

  if (mode === 'git') {
    const ok = await deployViaGitHub();
    if (!ok) process.exit(1);
    return;
  }

  const gitOk = await deployViaGitHub();
  if (!gitOk) {
    console.log('INFO GitHub deploy yok — yerel deploy deneniyor...');
    deployViaCli();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
