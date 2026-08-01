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
