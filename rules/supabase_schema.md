# Supabase Veritabanı Şeması

Tek admin auth modeli. Tüm tablolarda RLS: sadece `authenticated` kullanıcı erişebilir.

---

## Tablolar

### `businesses`

İşletme master verisi (`hakedisApp_businesses_v6` karşılığı).

| Kolon | Tip | Not |
|-------|-----|-----|
| id | text PK | Uygulama tarafından üretilir |
| name | text NOT NULL | İşletme adı |
| normal_fee | numeric NOT NULL DEFAULT 0 | NF — 0-5 km paket ücreti |
| distant_fee | numeric NOT NULL DEFAULT 0 | DF — 5+ km paket ücreti |
| vat | numeric NOT NULL DEFAULT 0 | KDV_R yüzdesi |
| region | text NOT NULL | Bölge adı |
| created_at | timestamptz DEFAULT now() | |
| updated_at | timestamptz DEFAULT now() | |

### `table_entries`

Satır girişleri — her işletme için 1:1 (`hakedisApp_tableData_v6`).

| Kolon | Tip | Not |
|-------|-----|-----|
| business_id | text PK FK → businesses(id) ON DELETE CASCADE | |
| normal_packages | numeric DEFAULT 0 | NP |
| distant_packages | numeric DEFAULT 0 | DP |
| bank_commission | numeric DEFAULT 0 | BK |
| pos_balance | numeric DEFAULT 0 | POS |
| cash_balance | numeric DEFAULT 0 | NAKIT |
| payment_status | text DEFAULT 'Odenmedi' | Enum: Odenmedi, Odendi, Kismi Odeme |
| has_quota | text DEFAULT 'Yok' | Enum: Yok, Var |
| notes | text DEFAULT '' | |
| updated_at | timestamptz DEFAULT now() | |

### `saved_reports`

Rapor snapshot'ları (`hakedisApp_savedReports_v1`).

| Kolon | Tip | Not |
|-------|-----|-----|
| id | text PK | reportId |
| business_id | text | İşletme referansı (silinse bile rapor kalır) |
| business_name | text NOT NULL | |
| business_region | text | |
| hesap_tarihi | date | |
| normal_packages | numeric | |
| distant_packages | numeric | |
| total_packages | numeric | |
| normal_fee_at_save | numeric | Snapshot — bug fix |
| distant_fee_at_save | numeric | Snapshot |
| vat_rate_at_save | numeric | Snapshot |
| hakedis | numeric | Yuvarlanmış |
| vat_amount | numeric | Yuvarlanmış |
| total_with_vat | numeric | Yuvarlanmış |
| bank_commission | numeric | |
| pos_balance | numeric | |
| cash_balance | numeric | |
| net_total | numeric | Yuvarlanmış |
| payment_status | text | |
| has_quota | text | |
| notes | text | |
| saved_at | timestamptz DEFAULT now() | |

### `regions`

Bölge listesi (`hakedisApp_regions_v1`).

| Kolon | Tip | Not |
|-------|-----|-----|
| id | serial PK | |
| name | text UNIQUE NOT NULL | |
| sort_order | int DEFAULT 0 | |

### `app_settings`

Uygulama ayarları (`hakedisApp_hesapTarihi_v6` vb.).

| Kolon | Tip | Not |
|-------|-----|-----|
| key | text PK | Örn: `hesap_tarihi` |
| value | jsonb NOT NULL | Örn: `"2026-06-13"` |

---

## RLS Politikaları

Her tablo için:

```sql
-- SELECT, INSERT, UPDATE, DELETE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated')
```

Anonim (`anon`) rolüne hiçbir tabloda erişim verilmez.

---

## Motor Takip (`002_motor_tracking.sql`)

### `couriers`

| Kolon | Tip | Not |
|-------|-----|-----|
| id | text PK | |
| name | text NOT NULL | Kurye adı |
| phone | text | |
| region | text | |
| is_active | boolean DEFAULT true | |
| notes | text | |

### `motors`

| Kolon | Tip | Not |
|-------|-----|-----|
| id | text PK | |
| plate | text UNIQUE NOT NULL | Plaka |
| brand, model | text | |
| courier_id | text FK → couriers | |
| region | text | |
| inspection_date | date | Muayene |
| insurance_expiry | date | Sigorta |
| status | text | Aktif / Bakımda / Pasif |
| odometer_km | numeric | |

### `motor_maintenance`

| Kolon | Tip | Not |
|-------|-----|-----|
| id | text PK | |
| motor_id | text FK → motors CASCADE | |
| service_date | date NOT NULL | |
| service_type | text | Muayene, Periyodik Bakım, vb. |
| cost | numeric | |
| next_due_date | date | Hatırlatma |
| receipt_url | text | Bakım fişi public URL |
| receipt_path | text | Storage path |

### `motor_assignments`

| Kolon | Tip | Not |
|-------|-----|-----|
| id | text PK | |
| motor_id | text FK → motors | |
| courier_id | text FK → couriers | |
| start_date | date | Atama başlangıcı |
| end_date | date | null = devam ediyor |
| created_by / updated_by | text | Kullanıcı e-postası |

### `motor_audit_log`

| Kolon | Tip | Not |
|-------|-----|-----|
| id | text PK | |
| entity_type | text | motor, courier, assignment, maintenance |
| action | text | create, update, delete, upsert |
| user_email | text | Kim yaptı |
| details | jsonb | Değişiklik detayı |

Storage bucket: `maintenance-receipts` (003_motor_ops.sql)

---

## Ortam Değişkenleri

| Değişken | Kullanım |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Sadece migrasyon script (opsiyonel) |

---

## Auth

- Tek admin hesabı Supabase Dashboard → Authentication → Users üzerinden oluşturulur
- Redirect URL: `https://<vercel-domain>/auth/callback`
- Local: `http://localhost:3000/auth/callback`
