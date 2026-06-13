#!/usr/bin/env node
/**
 * Standart deploy dogrulama: Vercel ayar + git/supabase/vercel kontrol
 * Kullanim: npm run deploy:verify
 * Agent: deploy/infra degisikligi sonrasi bu komutu calistirir
 */
import { execSync } from 'child_process';

function run(label: string, cmd: string) {
  console.log(`\n>>> ${label}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
}

async function main() {
  console.log('=== MaxiHesaplama Deploy Verify ===');

  run('1/2 Vercel framework + protection', 'npx tsx scripts/fix-vercel-project.ts --no-redeploy');
  run('2/2 Git + Supabase + Vercel health', 'npx tsx scripts/health-check.ts');

  console.log('\nDeploy verify tamamlandi.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
