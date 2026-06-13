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

## Deploy ve otomatik release

Her kod degisikliginden sonra:
```powershell
npm run release
```
GitHub + Supabase + Vercel otomatik. Sadece kontrol: `npm run deploy:verify`

## Kurallar

- Hesaplama formülleri: `rules/core_calculations.md` (değiştirilemez)
- Master kurallar: `rules/PROJECT_RULES.md`

## Eski sürüm

Vanilla HTML/JS sürümü `legacy/` klasöründe arşivlenmiştir.
