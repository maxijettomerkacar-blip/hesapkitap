-- Motor / kurye takip modülü
-- rules/supabase_schema.md ile uyumlu

CREATE TABLE IF NOT EXISTS couriers (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS motors (
  id text PRIMARY KEY,
  plate text NOT NULL UNIQUE,
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  courier_id text REFERENCES couriers(id) ON DELETE SET NULL,
  region text NOT NULL DEFAULT '',
  inspection_date date,
  insurance_expiry date,
  status text NOT NULL DEFAULT 'Aktif',
  odometer_km numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS motor_maintenance (
  id text PRIMARY KEY,
  motor_id text NOT NULL REFERENCES motors(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  service_type text NOT NULL DEFAULT 'Diğer',
  cost numeric NOT NULL DEFAULT 0,
  odometer_km numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  next_due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motors_courier ON motors(courier_id);
CREATE INDEX IF NOT EXISTS idx_motors_region ON motors(region);
CREATE INDEX IF NOT EXISTS idx_motor_maintenance_motor ON motor_maintenance(motor_id);
CREATE INDEX IF NOT EXISTS idx_motor_maintenance_date ON motor_maintenance(service_date DESC);

ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE motors ENABLE ROW LEVEL SECURITY;
ALTER TABLE motor_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_all_couriers ON couriers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_motors ON motors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY authenticated_all_motor_maintenance ON motor_maintenance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
