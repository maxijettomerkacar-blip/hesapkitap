# MaxiHesaplama

Profesyonel hakediş hesaplama uygulaması — Next.js + Supabase + Vercel.

## Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. `.env.local.example` dosyasını `.env.local` olarak kopyalayın ve değerleri doldurun.

3. **Detaylı kurulum:** [`SETUP_SUPABASE_VERCEL.md`](SETUP_SUPABASE_VERCEL.md)

4. Ortam kontrolü: `npm run env:check`

5. Supabase SQL Editor'de `supabase/migrations/001_initial_schema.sql` dosyasını çalıştırın.

6. Supabase Dashboard → Authentication → Users üzerinden admin hesabı oluşturun.

7. Geliştirme sunucusu:
   ```bash
   npm run dev
   ```

## Test

```bash
npm test
```

## Veri import (localStorage yedeği)

```bash
npm run migrate:import -- path/to/maxi_yedek.json
```

`SUPABASE_SERVICE_ROLE_KEY` ortam değişkeni gerekir.

## Vercel Deploy

1. Repo'yu GitHub'a push edin.
2. Vercel'de projeyi import edin.
3. Environment variables ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Supabase Auth redirect URL: `https://<domain>/auth/callback`

## Kurallar

- Hesaplama formülleri: `rules/core_calculations.md` (değiştirilemez)
- Master kurallar: `rules/PROJECT_RULES.md`

## Eski sürüm

Vanilla HTML/JS sürümü `legacy/` klasöründe arşivlenmiştir.
