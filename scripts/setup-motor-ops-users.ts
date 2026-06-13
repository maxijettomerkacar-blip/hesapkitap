#!/usr/bin/env node
/**
 * Motor operasyon kullanicilarini Supabase Auth'a ekler veya gunceller.
 * Sifre repoya yazilmaz — calistirirken ortam degiskeni verin:
 *
 *   $env:MOTOR_OPS_SETUP_PASSWORD='...'; npx tsx scripts/setup-motor-ops-users.ts
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvLocal } from '../lib/load-env';

loadEnvLocal();

const DEFAULT_EMAILS = [
  'eren@maxicanakkale.com',
  'mehmetcan@maxicanakkale.com',
  'erenatici@maxicanakkale.com',
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const password = process.env.MOTOR_OPS_SETUP_PASSWORD;

  if (!url || !serviceKey) {
    console.error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local)');
    process.exit(1);
  }
  if (!password) {
    console.error('MOTOR_OPS_SETUP_PASSWORD ortam degiskeni gerekli (sifre repoya yazilmaz).');
    process.exit(1);
  }

  const emails = process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_EMAILS;
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('Kullanici listesi alinamadi:', listError.message);
    process.exit(1);
  }

  for (const email of emails) {
    const normalized = email.trim().toLowerCase();
    const existing = listData.users.find((u) => u.email?.toLowerCase() === normalized);

    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
        app_metadata: { ...existing.app_metadata, role: 'motor_ops' },
      });
      if (error) {
        console.error(`GUNCELLEME HATA ${normalized}:`, error.message);
        continue;
      }
      console.log(`OK guncellendi: ${normalized} (motor_ops)`);
      continue;
    }

    const { error } = await supabase.auth.admin.createUser({
      email: normalized,
      password,
      email_confirm: true,
      app_metadata: { role: 'motor_ops' },
    });
    if (error) {
      console.error(`OLUSTURMA HATA ${normalized}:`, error.message);
      continue;
    }
    console.log(`OK olusturuldu: ${normalized} (motor_ops)`);
  }

  console.log('\nGiris: /motor-yonetim veya /login?portal=motor');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
