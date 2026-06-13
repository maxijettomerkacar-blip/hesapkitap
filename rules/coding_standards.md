# Kodlama ve Geliştirme Standartları

## 1. Genel Prensipler

- **DRY:** Hesaplama mantığı tek modülde (`lib/calculations.ts`)
- **KISS:** Gereksiz abstraction yok
- **Single source of truth:** Formül, rapor metni ve formatters ayrı modüllerde, tekrarsız

## 2. TypeScript / React Kuralları

- Strict TypeScript; `any` kullanılmaz
- Client bileşenleri: `'use client'` direktifi gerektiğinde
- Hesaplama **sadece** `lib/calculations.ts` — UI `calculateRow()` çağırır
- Supabase CRUD: `lib/supabase/queries.ts`
- Tipler: `lib/types.ts`

## 3. Hesaplama Modülü

```typescript
// Doğru
import { calculateRow } from '@/lib/calculations';
const result = calculateRow({ normalPackages, distantPackages, ... });

// Yanlış — UI içinde formül
const hakedis = np * nf + dp * df; // YASAK
```

## 4. HTML/CSS Kuralları

- Inline `style="..."` yok; global CSS veya CSS modules
- CSS değişkenleri (`:root`) renk ve spacing için
- Semantic HTML: `header`, `main`, `section`

## 5. Güvenlik ve Veri

- Supabase RLS: authenticated-only
- Kullanıcı girdileri: `parseFloatOrZero` ile tip güvenliği
- Hata durumları: kullanıcıya Toast/Dialog; production'da gereksiz `console.log` yok

## 6. Test

- `lib/calculations.test.ts` her değişiklikte geçmeli
- Formül değişikliği = test güncellemesi + `core_calculations.md` onayı (onay olmadan yapılmaz)
