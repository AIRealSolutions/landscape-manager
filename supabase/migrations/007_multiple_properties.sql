-- Customers can own multiple properties. Property details, photos, and
-- workflows move from the customer to the property; jobs point at the
-- property being serviced. Existing per-customer data is migrated into a
-- "Primary" property automatically.

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  label VARCHAR NOT NULL DEFAULT 'Primary',
  address VARCHAR NOT NULL,
  property_type VARCHAR DEFAULT 'residential',
  lot_size VARCHAR,
  lawn_area_sqft INTEGER,
  property_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_properties_customer_id ON properties(customer_id);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their company's properties" ON properties;
CREATE POLICY "Users can manage their company's properties"
  ON properties FOR ALL
  USING (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ));

-- Attach photos, workflow steps, and jobs to a property
ALTER TABLE property_photos ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_property_photos_property_id ON property_photos(property_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_property_id ON workflow_steps(property_id);
CREATE INDEX IF NOT EXISTS idx_jobs_property_id ON jobs(property_id);

-- Migrate: every customer without a property gets a "Primary" one built
-- from their existing customer-level property fields
INSERT INTO properties (customer_id, label, address, property_type, lot_size, lawn_area_sqft, property_notes)
SELECT
  c.id,
  'Primary',
  COALESCE(NULLIF(c.address, ''), 'Address on file'),
  COALESCE(c.property_type, 'residential'),
  c.lot_size,
  c.lawn_area_sqft,
  c.property_notes
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.customer_id = c.id);

-- Point existing photos, steps, and jobs at the customer's first property
UPDATE property_photos pp
SET property_id = (
  SELECT p.id FROM properties p
  WHERE p.customer_id = pp.customer_id
  ORDER BY p.created_at LIMIT 1
)
WHERE pp.property_id IS NULL;

UPDATE workflow_steps ws
SET property_id = (
  SELECT p.id FROM properties p
  WHERE p.customer_id = ws.customer_id
  ORDER BY p.created_at LIMIT 1
)
WHERE ws.property_id IS NULL;

UPDATE jobs j
SET property_id = (
  SELECT p.id FROM properties p
  WHERE p.customer_id = j.customer_id
  ORDER BY p.created_at LIMIT 1
)
WHERE j.property_id IS NULL;
