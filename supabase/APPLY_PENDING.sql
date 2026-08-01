-- ============================================================
-- RUN THIS ONCE in Supabase Dashboard -> SQL Editor -> New query
-- Pending: migrations 005 + 006. Safe to re-run (idempotent).
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
