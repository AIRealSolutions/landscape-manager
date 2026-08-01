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
