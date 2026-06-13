# MaxiHesaplama — Proje Kuralları (Master)

Bu dosya migrasyon ve geliştirme sürecindeki tüm bağlayıcı kuralları tanımlar. Çelişki durumunda öncelik sırası:

1. `rules/core_calculations.md` (değiştirilemez)
2. Bu dosya (`PROJECT_RULES.md`)
3. `rules/supabase_schema.md`, `rules/tech_stack.md`, `rules/coding_standards.md`

---

## 1. Değiştirilemez Hesaplama Kuralları

Tüm finansal hesaplamalar [`core_calculations.md`](core_calculations.md) ile birebir uyumlu olmalıdır.

| Formül | İfade |
|--------|-------|
| Hakediş | `(NP × NF) + (DP × DF)` |
| KDV Tutarı | `Hakediş × (KDV_R / 100)` |
| KDV Dahil | `Hakediş + KDV Tutarı` |
| Net Tutar | `KDV Dahil + BK - POS - NAKIT` |

**Tek kaynak:** `lib/calculations.ts` — UI, rapor metni ve kayıt işlemleri bu modülü çağırır; formül kopyalanmaz.

---

## 2. Net Tutar Yorum Kuralları (Rapor Metni)

Formülü değiştirmez; sadece etiketleme:

| Koşul | Etiket | Gösterilen tutar |
|-------|--------|------------------|
| `netTotal < 0` | SİZE ÖDEYECEĞİMİZ Tutar | `Math.abs(netTotal)` |
| `netTotal >= 0` | TARAFIMIZA ÖDEYECEĞİZ Tutar | `netTotal` |

Canlı rapor ve kayıtlı rapor kopyalama aynı `lib/report-text.ts` modülünü kullanır.

---

## 3. Hesaplamayı Etkilemeyen Alanlar

Aşağıdaki alanlar **metadata**dır; formüllere dahil edilmez:

- `paymentStatus` — `Odenmedi` | `Odendi` | `Kismi Odeme`
- `hasQuota` — `Yok` | `Var`
- `cancelledPackages` — sadece rapor metninde gösterilir (varsa), toplamlardan düşülmez
- `notes` — serbest metin

---

## 4. Yuvarlama ve Boş Girdi Kuralları

- Boş, null veya undefined sayısal girdi → `0`
- Ekranda para: `toFixed(2)` (`formatCurrency`)
- Kayıt anında yuvarlama (saved_reports): `hakedis`, `vatAmount`, `totalWithVat`, `netTotal` → `parseFloat(x.toFixed(2))`
- `bankCommission`, `posBalance`, `cashBalance` kayıtta ham sayı olarak saklanır

---

## 5. Sabit Enum Değerleri (Değiştirilmez)

Migrasyon sırasında bu string değerler korunmalıdır (veritabanı ve UI uyumu):

**Ödeme durumu:** `Odenmedi`, `Odendi`, `Kismi Odeme`

**Kota:** `Yok`, `Var`

**Bölge filtresi:** `Tümü` (UI-only, DB'de saklanmaz)

---

## 6. Bilinçli Düzeltmeler (Formül Bozulmadan)

| Eski davranış | Yeni davranış |
|---------------|---------------|
| İşletme sayısı ≠ 44 → tüm liste sıfırlanır | Seed sadece boş DB'de bir kez; sonrasında serbest CRUD |
| `saved_reports` ücret snapshot alanları eksik | `normal_fee_at_save`, `distant_fee_at_save`, `vat_rate_at_save` kaydedilir |
| Formül 3 yerde kopyalanmış | Tek modül: `lib/calculations.ts` |
| Rapor metni iki farklı wording | Tek modül: `lib/report-text.ts` |
| `localStorage` | Supabase PostgreSQL |

---

## 7. Yasaklar

- `core_calculations.md` formüllerini değiştirmek
- UI bileşenlerinde doğrudan hesaplama yazmak
- Enum string değerlerini Türkçe karakter veya yazım değişikliği olmadan değiştirmek
- Bootstrap, jQuery gibi ağır UI framework'leri eklemek
- Hesaplama birim testlerini kırmak

---

## 8. Veri Yedekleme Uyumluluğu

JSON yedek formatı korunur:

```json
{
  "app": "MaxiHesaplama",
  "version": "v6",
  "data": { "businesses", "tableData", "savedReports", "regions" }
}
```

Import script bu formatı doğrular (`app === "MaxiHesaplama"`).

---

## 9. QA Zorunlu Senaryolar

Her release öncesi `lib/calculations.test.ts` geçmelidir:

1. Tüm alanlar boş → tüm sonuçlar 0
2. Örnek: NP=10, NF=25, DP=5, DF=35, KDV=20, BK=100, POS=500, NAKIT=200 → manuel doğrulama
3. Net negatif / pozitif etiket doğruluğu
