# Supabase + Vercel Kurulum Rehberi

Bu rehberi sırayla takip edin. Değerleri aldıkça `.env.local` dosyasına yazın.

---

## Bölüm 1 — Supabase (15 dk)

### 1.1 Proje oluştur

1. [supabase.com](https://supabase.com) → giriş yapın
2. **New project** → isim: `maxi-hesaplama` (veya istediğiniz)
3. Database password kaydedin (bir yere not alın)
4. Region: **Frankfurt (eu-central-1)** — Türkiye'ye yakın

### 1.2 API anahtarlarını al

1. Sol menü → **Project Settings** (dişli) → **API**
2. Şunları kopyalayın:

| Alan | `.env.local` değişkeni |
|------|------------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role (Reveal) | `SUPABASE_SERVICE_ROLE_KEY` |

3. `.env.local` dosyasına yapıştırın

### 1.3 Veritabanı tablolarını oluştur

1. Sol menü → **SQL Editor** → **New query**
2. Repo'daki dosyanın tamamını yapıştırın:  
   `supabase/migrations/001_initial_schema.sql`
3. **Run** — hata yoksa 5 tablo + RLS oluşur

### 1.4 Admin kullanıcı oluştur

1. Sol menü → **Authentication** → **Users** → **Add user** → **Create new user**
2. Email: `maxijett.omerkacar@gmail.com` (veya kullanacağınız admin mail)
3. Password: güçlü bir şifre belirleyin
4. **Auto Confirm User** işaretli olsun

Bu email/şifre ile `/login` sayfasından giriş yapacaksınız.

### 1.5 Auth URL ayarları (Vercel domain belli olunca tekrar güncellenir)

**Authentication** → **URL Configuration**:

| Alan | Değer |
|------|-------|
| Site URL | `http://localhost:3000` (geliştirme) |
| Redirect URLs | `http://localhost:3000/auth/callback` |

Vercel deploy sonrası ekleyin:
```
https://SIZIN-VERCEL-DOMAIN.vercel.app/auth/callback
```

---

## Bölüm 2 — Yerel test

`.env.local` doldurulduktan sonra:

```powershell
cd c:\Users\kacar\OneDrive\Desktop\HesaplamaProg2026
npm run dev
```

Tarayıcı: http://localhost:3000 → login → admin email/şifre

---

## Bölüm 3 — Vercel (10 dk)

### 3.1 Projeyi bağla

1. [vercel.com](https://vercel.com) → giriş (GitHub ile)
2. **Add New** → **Project**
3. Import: **maxijettomerkacar-blip/hesapkitap**
4. Framework: **Next.js** (otomatik algılanır)

### 3.2 Environment Variables (Deploy öncesi)

**Environment Variables** bölümüne ekleyin:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Production, Preview, Development |

**Eklemeyin:** `SUPABASE_SERVICE_ROLE_KEY` — sadece yerel import scripti için.

### 3.3 Deploy

**Deploy** → birkaç dakika sonra URL: `https://hesapkitap-xxx.vercel.app`

### 3.4 Supabase Auth'u Vercel domain ile güncelle

Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://hesapkitap-xxx.vercel.app`
- **Redirect URLs** listesine ekle:
  ```
  https://hesapkitap-xxx.vercel.app/auth/callback
  ```

---

## Bölüm 4 — Eski veri taşıma (opsiyonel)

Elinizde `maxi_yedek_*.json` varsa:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "service_role_key_buraya"
npm run migrate:import -- "C:\yol\maxi_yedek_2026-06-13.json"
```

---

## Bana vermeniz gerekenler (ben doldurmam için)

Aşağıdakileri paylaşırsanız `.env.local` ve Vercel env'lerini sizin adınıza yapılandırabilirim:

| # | Bilgi | Nereden |
|---|-------|---------|
| 1 | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| 3 | Admin email + şifre | Siz belirlersiniz (şifreyi chat'te paylaşmayın; sadece Supabase'de oluşturun) |
| 4 | Vercel proje URL'si | Deploy sonrası (ör: `hesapkitap.vercel.app`) |

**Paylaşmayın / repoya yazmayın:**
- `service_role` key (sadece import için, yerelde kalır)
- GitHub PAT
- Database password

---

## Kontrol listesi

- [ ] Supabase projesi oluşturuldu
- [ ] `001_initial_schema.sql` çalıştırıldı
- [ ] Admin kullanıcı oluşturuldu
- [ ] `.env.local` dolduruldu
- [ ] `npm run dev` ile localhost çalışıyor
- [ ] Vercel'e deploy edildi
- [ ] Supabase Redirect URL Vercel domain eklendi
- [ ] Production'da login test edildi
