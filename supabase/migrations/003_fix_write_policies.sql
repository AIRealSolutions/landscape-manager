-- Fix: RLS was enabled on core tables but only SELECT policies existed,
-- so every INSERT/UPDATE from the app was denied. Also allow first-login
-- provisioning (create own users row + company).

-- Users: manage own profile row
CREATE POLICY "Users can create their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Companies: any signed-in user can create one (first login) and read/update their own
CREATE POLICY "Authenticated users can create companies"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  USING (id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Customers: full write access within own company
CREATE POLICY "Users can create their company's customers"
  ON customers FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their company's customers"
  ON customers FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their company's customers"
  ON customers FOR DELETE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Services: company-scoped read/write
CREATE POLICY "Users can manage their company's services"
  ON services FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Crew: company-scoped read/write
CREATE POLICY "Users can manage their company's crew"
  ON crew FOR ALL
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Jobs: write access scoped through the customer's company
CREATE POLICY "Users can create their company's jobs"
  ON jobs FOR INSERT
  WITH CHECK (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "Users can update their company's jobs"
  ON jobs FOR UPDATE
  USING (customer_id IN (
    SELECT id FROM customers
    WHERE company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
  ));

-- Invoices: scoped through the customer's company
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

-- Notifications: scoped through the customer's company
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
