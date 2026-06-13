#!/usr/bin/env node
/**
 * OTOMATIK RELEASE — GitHub + Supabase + Vercel
 * Agent: kod degisikligi sonrasi MUTLAKA calistir: npm run release
 *
 * Akis:
 *   1. test + build
 *   2. git commit + push (GITHUB_TOKEN)
 *   3. supabase migration (gerekirse) + kontrol
 *   4. vercel env sync + fix + redeploy
 *   5. deploy verify
 */
import { execSync } from 'child_process';
import { loadEnvLocal } from '../lib/load-env';

loadEnvLocal();

const commitMessage = process.argv.slice(2).join(' ') || 'chore: guncelleme';

function run(label: string, cmd: string, optional = false) {
  console.log(`\n>>> ${label}\n`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: process.cwd(), env: process.env });
  } catch {
    if (!optional) {
      console.error(`FAIL: ${label}`);
      process.exit(1);
    }
    console.warn(`ATLANDI (opsiyonel): ${label}`);
  }
}

function gitPush() {
  const token = process.env.GITHUB_TOKEN;
  const remote = 'https://github.com/maxijettomerkacar-blip/hesapkitap.git';
  const branch = 'main';

  const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();
  if (status) {
    execSync('git add -A', { stdio: 'inherit' });
    execSync(
      `git -c user.email="maxijett.omerkacar@gmail.com" -c user.name="maxijettomerkacar-blip" commit -m "${commitMessage.replace(/"/g, '\\"')}"`,
      { stdio: 'inherit' },
    );
  } else {
    console.log('INFO Commit edilecek degisiklik yok');
  }

  if (!token) {
    console.warn('UYARI: GITHUB_TOKEN yok — git push atlandi');
    try {
      execSync(`git push origin ${branch}`, { stdio: 'inherit' });
    } catch {
      console.error('Git push basarisiz. .env.local → GITHUB_TOKEN ekleyin');
    }
    return;
  }

  const pushUrl = remote.replace('https://', `https://maxijettomerkacar-blip:${token}@`);
  execSync(`git push ${pushUrl} ${branch}`, { stdio: 'inherit' });
  execSync(`git remote set-url origin ${remote}`, { stdio: 'inherit' });
  console.log('OK GitHub push tamamlandi');
}

async function main() {
  console.log('========================================');
  console.log('  MaxiHesaplama — Otomatik Release');
  console.log('  GitHub + Supabase + Vercel');
  console.log('========================================');

  run('1/7 Test', 'npm test');
  run('2/7 Build', 'npm run build');
  run('3/7 Env', 'npm run env:check');

  console.log('\n>>> 4/7 Git commit + push\n');
  gitPush();

  run('5/7 Supabase (migration + kontrol)', 'npx tsx scripts/apply-supabase-migrations.ts', true);
  run('5b/7 Supabase kontrol', 'npx tsx scripts/check-supabase.ts');

  if (process.env.VERCEL_TOKEN) {
    run('6/7 Vercel env sync', 'npx tsx scripts/sync-vercel-env.ts');
    run('6b/7 Vercel fix + redeploy', 'npx tsx scripts/fix-vercel-project.ts', true);
  } else {
    console.warn('\nUYARI: VERCEL_TOKEN yok — Vercel adimlari atlandi');
  }

  run('7/7 Deploy verify', 'npx tsx scripts/deploy-verify.ts');

  console.log('\n========================================');
  console.log('  Release tamamlandi');
  if (process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL) {
    console.log(`  Canli: ${process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL}`);
  }
  console.log('========================================\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
