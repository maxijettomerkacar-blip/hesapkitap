#!/usr/bin/env node
/**
 * localStorage JSON yedeğini Supabase'e import eder.
 * Kullanım: npm run migrate:import -- path/to/maxi_yedek.json
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import type { BackupData } from '../lib/types';
import { importBackupData } from '../lib/supabase/queries';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Kullanım: npm run migrate:import -- <yedek.json>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
  process.exit(1);
}

const raw = readFileSync(filePath, 'utf-8');
const backup = JSON.parse(raw) as BackupData;

if (backup.app !== 'MaxiHesaplama') {
  console.error('Geçersiz yedek: app !== MaxiHesaplama');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log('Import başlıyor...');
  await importBackupData(supabase, backup.data);
  console.log('Import tamamlandı.');
  console.log(`  İşletmeler: ${backup.data.businesses.length}`);
  console.log(`  Raporlar: ${backup.data.savedReports.length}`);
  console.log(`  Bölgeler: ${backup.data.regions.length}`);
}

main().catch((e) => {
  console.error('Import hatası:', e);
  process.exit(1);
});
