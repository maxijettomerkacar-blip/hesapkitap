-- MaxiHesaplama initial schema
-- rules/supabase_schema.md ile uyumlu

CREATE TABLE IF NOT EXISTS businesses (
  id text PRIMARY KEY,
  name text NOT NULL,
  normal_fee numeric NOT NULL DEFAULT 0,
  distant_fee numeric NOT NULL DEFAULT 0,
  vat numeric NOT NULL DEFAULT 0,
  region text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS table_entries (
  business_id text PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,
  normal_packages numeric NOT NULL DEFAULT 0,
  distant_packages numeric NOT NULL DEFAULT 0,
  bank_commission numeric NOT NULL DEFAULT 0,
  pos_balance numeric NOT NULL DEFAULT 0,
  cash_balance numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'Odenmedi',
  has_quota text NOT NULL DEFAULT 'Yok',
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saved_reports (
  id text PRIMARY KEY,
  business_id text,
  business_name text NOT NULL,
  business_region text,
  hesap_tarihi date,
  normal_packages numeric NOT NULL DEFAULT 0,
  distant_packages numeric NOT NULL DEFAULT 0,
  total_packages numeric NOT NULL DEFAULT 0,
  normal_fee_at_save numeric NOT NULL DEFAULT 0,
  distant_fee_at_save numeric NOT NULL DEFAULT 0,
  vat_rate_at_save numeric NOT NULL DEFAULT 0,
  hakedis numeric NOT NULL DEFAULT 0,
  vat_amount numeric NOT NULL DEFAULT 0,
  total_with_vat numeric NOT NULL DEFAULT 0,
  bank_commission numeric NOT NULL DEFAULT 0,
  pos_balance numeric NOT NULL DEFAULT 0,
  cash_balance numeric NOT NULL DEFAULT 0,
  net_total numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'Odenmedi',
  has_quota text NOT NULL DEFAULT 'Yok',
  notes text NOT NULL DEFAULT '',
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS regions (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

-- RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_businesses" ON businesses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_table_entries" ON table_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_saved_reports" ON saved_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_regions" ON regions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_app_settings" ON app_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_reports_saved_at ON saved_reports(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_reports_hesap_tarihi ON saved_reports(hesap_tarihi);
CREATE INDEX IF NOT EXISTS idx_businesses_region ON businesses(region);
