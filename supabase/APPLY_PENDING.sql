-- ============================================================
-- RUN THIS ONCE in Supabase Dashboard -> SQL Editor -> New query
-- Pending: migrations 005 + 006 + 007 + 008 + 009. Safe to re-run.
-- ============================================================

-- Property details, property photos, and job completion criteria

-- Property details on customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS property_type VARCHAR DEFAULT 'residential';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lot_size VARCHAR;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lawn_area_sqft INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS property_notes TEXT;

-- What the job covers and what "done" looks like
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS key_aspects TEXT[] DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completion_criteria TEXT;

-- Photos of the property / before / after / reference
CREATE TABLE IF NOT EXISTS property_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  storage_path VARCHAR NOT NULL,
  url VARCHAR NOT NULL,
  caption VARCHAR,
  category VARCHAR NOT NULL DEFAULT 'property'
    CHECK (category IN ('property', 'before', 'after', 'reference', 'issue')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_property_photos_customer_id ON property_photos(customer_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_job_id ON property_photos(job_id);

ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their company's property photos" ON property_photos;
CREATE POLICY "Users can manage their company's property photos"
  ON property_photos FOR ALL
  USING (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ));

-- Storage bucket for the image files (public read so photos render via URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload property photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-photos');

DROP POLICY IF EXISTS "Anyone can view property photos" ON storage.objects;
CREATE POLICY "Anyone can view property photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

DROP POLICY IF EXISTS "Authenticated users can delete property photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete property photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-photos');

-- Per-property workflows: an ordered list of work steps for each customer's
-- property, plus per-job tracking of which steps the crew has completed.

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  step_order INTEGER NOT NULL DEFAULT 0,
  title VARCHAR NOT NULL,
  instructions TEXT,
  area VARCHAR,
  requires_photo BOOLEAN DEFAULT false,
  estimated_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_customer_id ON workflow_steps(customer_id);

CREATE TABLE IF NOT EXISTS job_step_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (job_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_job_step_completions_job_id ON job_step_completions(job_id);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_step_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their company's workflow steps" ON workflow_steps;
CREATE POLICY "Users can manage their company's workflow steps"
  ON workflow_steps FOR ALL
  USING (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ));

DROP POLICY IF EXISTS "Users can manage their company's step completions" ON job_step_completions;
CREATE POLICY "Users can manage their company's step completions"
  ON job_step_completions FOR ALL
  USING (job_id IN (
    SELECT id FROM jobs WHERE customer_id IN (
      SELECT id FROM customers
      WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    )
  ))
  WITH CHECK (job_id IN (
    SELECT id FROM jobs WHERE customer_id IN (
      SELECT id FROM customers
      WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
    )
  ));

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

-- Blocked time on the company calendar: vacations, holidays, and recurring
-- in-day periods (lunch, maintenance) when service can't be provided.

CREATE TABLE IF NOT EXISTS schedule_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR NOT NULL,
  block_type VARCHAR NOT NULL DEFAULT 'other'
    CHECK (block_type IN ('vacation', 'holiday', 'personal', 'maintenance', 'break', 'other')),
  start_date DATE NOT NULL,
  end_date DATE,
  all_day BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  recurrence VARCHAR NOT NULL DEFAULT 'none'
    CHECK (recurrence IN ('none', 'daily', 'weekly')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_company_id ON schedule_blocks(company_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_start_date ON schedule_blocks(start_date);

ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their company's schedule blocks" ON schedule_blocks;
CREATE POLICY "Users can manage their company's schedule blocks"
  ON schedule_blocks FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

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

