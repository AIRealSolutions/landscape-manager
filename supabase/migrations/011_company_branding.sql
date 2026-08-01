-- Branding lives in the company's own database, editable from the admin
-- Business Settings page. The public homepage reads it through a
-- SECURITY DEFINER function that exposes only the public-facing fields.

ALTER TABLE companies ADD COLUMN IF NOT EXISTS tagline VARCHAR;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email VARCHAR;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS service_area VARCHAR;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS emoji VARCHAR DEFAULT '🌳';

CREATE OR REPLACE FUNCTION public.get_public_company()
RETURNS TABLE (
  name VARCHAR,
  tagline VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  service_area VARCHAR,
  emoji VARCHAR,
  website VARCHAR
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name, tagline, phone, email, service_area, emoji, website
  FROM companies
  ORDER BY created_at
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_company TO anon, authenticated;
