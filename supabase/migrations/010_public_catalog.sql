-- Public services catalog: the customer-facing homepage shows the company's
-- services and prices to anonymous visitors (a normal public price menu).
-- Writes remain company-scoped.

DROP POLICY IF EXISTS "Anyone can view services" ON services;
CREATE POLICY "Anyone can view services"
  ON services FOR SELECT
  USING (true);
