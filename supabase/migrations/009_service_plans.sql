-- Recurring service plans for seasonal customers: a special per-visit rate
-- and an interval; completing a job auto-creates the next one interval_days
-- after the completion date, within the plan's season window.

CREATE TABLE IF NOT EXISTS service_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL UNIQUE,
  service_ids UUID[] NOT NULL DEFAULT '{}',
  override_price DECIMAL(10, 2),
  interval_days INTEGER NOT NULL DEFAULT 7,
  preferred_time TIME DEFAULT '09:00',
  estimated_duration INTEGER DEFAULT 60,
  season_start DATE,
  season_end DATE,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_plans_customer_id ON service_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_plans_property_id ON service_plans(property_id);

ALTER TABLE service_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their company's service plans" ON service_plans;
CREATE POLICY "Users can manage their company's service plans"
  ON service_plans FOR ALL
  USING (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ));
