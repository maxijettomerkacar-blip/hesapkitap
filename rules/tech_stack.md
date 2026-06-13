# Teknoloji Yığını ve Yapılandırma

## 1. Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Dil | TypeScript |
| Veritabanı | Supabase (PostgreSQL) |
| Auth | Supabase Auth (tek admin) |
| Deployment | Vercel |
| Stil | CSS Modules / global CSS (CSS variables) |
| Test | Vitest |
| İkonlar | Inline SVG (Bootstrap CSS/JS yok) |

### İzin verilen npm paketleri

- `next`, `react`, `react-dom`
- `@supabase/supabase-js`, `@supabase/ssr`
- `vitest` (dev)

### Yasak

- Bootstrap, Tailwind, jQuery
- Hesaplama için harici finans kütüphaneleri

## 2. Dosya Yapısı

```
/
├── app/                    # Next.js sayfaları
├── components/             # React bileşenleri
├── lib/
│   ├── calculations.ts     # TEK hesaplama kaynağı
│   ├── formatters.ts
│   ├── report-text.ts
│   ├── types.ts
│   └── supabase/
├── supabase/migrations/    # SQL migrasyonları
├── scripts/                # Veri import scriptleri
├── rules/                  # Proje kuralları
├── legacy/                 # Eski vanilla HTML/JS (referans)
└── .env.local.example
```

## 3. Ortam

- `.env.local`: Supabase URL ve anon key (git'e eklenmez)
- Vercel: aynı env değişkenleri production'da tanımlanır
