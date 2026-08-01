-- ============================================================
-- RUN THIS ONCE in Supabase Dashboard -> SQL Editor -> New query
-- Combines migrations 003 + 004. Safe to re-run (idempotent).
-- ============================================================

-- ---------- 003: missing write policies ----------
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;
CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own company" ON companies;
CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can create their company's customers" ON customers;
CREATE POLICY "Users can create their company's customers"
  ON customers FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their company's customers" ON customers;
CREATE POLICY "Users can update their company's customers"
  ON customers FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete their company's customers" ON customers;
CREATE POLICY "Users can delete their company's customers"
  ON customers FOR DELETE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their company's services" ON services;
CREATE POLICY "Users can manage their company's services"
  ON services FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their company's crew" ON crew;
CREATE POLICY "Users can manage their company's crew"
  ON crew FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can create their company's jobs" ON jobs;
CREATE POLICY "Users can create their company's jobs"
  ON jobs FOR INSERT
  WITH CHECK (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update their company's jobs" ON jobs;
CREATE POLICY "Users can update their company's jobs"
  ON jobs FOR UPDATE
  USING (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ));

DROP POLICY IF EXISTS "Users can manage their company's invoices" ON invoices;
CREATE POLICY "Users can manage their company's invoices"
  ON invoices FOR ALL
  USING (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ));

DROP POLICY IF EXISTS "Users can manage their company's notifications" ON notifications;
CREATE POLICY "Users can manage their company's notifications"
  ON notifications FOR ALL
  USING (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ))
  WITH CHECK (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ));

-- ---------- 004: public lead capture ----------
-- Public lead capture: the website form posts anonymously, but leads RLS
-- only allows signed-in company users to insert. Expose a single
-- SECURITY DEFINER function so anonymous visitors can submit a lead
-- without opening up the tables themselves.

CREATE OR REPLACE FUNCTION public.capture_lead(
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_property_size TEXT DEFAULT NULL,
  p_service_interested TEXT[] DEFAULT '{}',
  p_lead_source TEXT DEFAULT 'website',
  p_lead_score INTEGER DEFAULT 0,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_lead_id UUID;
BEGIN
  IF p_first_name IS NULL OR p_last_name IS NULL OR p_phone IS NULL THEN
    RAISE EXCEPTION 'first name, last name and phone are required';
  END IF;

  SELECT id INTO v_company_id FROM companies ORDER BY created_at LIMIT 1;
  IF v_company_id IS NULL THEN
    INSERT INTO companies (name) VALUES ('Default Company')
    RETURNING id INTO v_company_id;
  END IF;

  INSERT INTO leads (
    company_id, first_name, last_name, email, phone, address,
    property_size, service_interested, lead_source, status, lead_score, notes
  ) VALUES (
    v_company_id, p_first_name, p_last_name, p_email, p_phone, p_address,
    p_property_size, COALESCE(p_service_interested, '{}'),
    COALESCE(p_lead_source, 'website'), 'new',
    LEAST(GREATEST(COALESCE(p_lead_score, 0), 0), 100), p_notes
  )
  RETURNING id INTO v_lead_id;

  RETURN v_lead_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.capture_lead TO anon, authenticated;
