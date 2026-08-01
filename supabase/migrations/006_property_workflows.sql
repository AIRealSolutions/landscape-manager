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
