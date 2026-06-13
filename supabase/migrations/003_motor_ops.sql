-- Motor operasyon: bakım fişi, atama geçmişi, denetim kaydı

ALTER TABLE motor_maintenance
  ADD COLUMN IF NOT EXISTS receipt_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS receipt_path text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS motor_assignments (
  id text PRIMARY KEY,
  motor_id text NOT NULL REFERENCES motors(id) ON DELETE CASCADE,
  courier_id text NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date,
  notes text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT '',
  updated_by text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motor_assignments_motor ON motor_assignments(motor_id);
CREATE INDEX IF NOT EXISTS idx_motor_assignments_courier ON motor_assignments(courier_id);
CREATE INDEX IF NOT EXISTS idx_motor_assignments_dates ON motor_assignments(start_date, end_date);

CREATE TABLE IF NOT EXISTS motor_audit_log (
  id text PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  summary text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '{}',
  user_email text NOT NULL DEFAULT '',
  user_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motor_audit_created ON motor_audit_log(created_at DESC);

ALTER TABLE motor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE motor_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_all_motor_assignments ON motor_assignments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_motor_audit_log ON motor_audit_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bakım fişi depolama
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maintenance-receipts',
  'maintenance-receipts',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY maintenance_receipts_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'maintenance-receipts');

CREATE POLICY maintenance_receipts_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'maintenance-receipts');

CREATE POLICY maintenance_receipts_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'maintenance-receipts');

CREATE POLICY maintenance_receipts_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'maintenance-receipts');
