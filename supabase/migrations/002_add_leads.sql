-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR NOT NULL,
  address VARCHAR,
  property_size VARCHAR,
  service_interested VARCHAR[] NOT NULL,
  lead_source VARCHAR NOT NULL DEFAULT 'website' CHECK (lead_source IN ('website', 'phone', 'referral', 'social', 'advertisement', 'other')),
  status VARCHAR NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'quoted', 'negotiating', 'won', 'lost', 'archived')),
  lead_score INTEGER DEFAULT 0,
  estimated_value DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  contacted_at TIMESTAMP,
  quote_sent_at TIMESTAMP,
  converted_at TIMESTAMP,
  converted_to_customer_id UUID REFERENCES customers(id)
);

-- Create lead interactions table (phone calls, emails, meetings)
CREATE TABLE IF NOT EXISTS lead_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  interaction_type VARCHAR NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'sms', 'note')),
  subject VARCHAR NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES users(id),
  next_follow_up TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create lead quotes table
CREATE TABLE IF NOT EXISTS lead_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  quote_number VARCHAR UNIQUE NOT NULL,
  services VARCHAR[] NOT NULL,
  estimated_cost DECIMAL(10, 2) NOT NULL,
  valid_until DATE NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  viewed_at TIMESTAMP,
  accepted_at TIMESTAMP,
  rejected_at TIMESTAMP
);

-- Enable RLS on new tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_quotes ENABLE ROW LEVEL SECURITY;

-- Create policies for leads
CREATE POLICY "Users can view their company's leads"
  ON leads FOR SELECT
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create leads for their company"
  ON leads FOR INSERT
  WITH CHECK (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their company's leads"
  ON leads FOR UPDATE
  USING (company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX idx_leads_company_id ON leads(company_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_lead_interactions_lead_id ON lead_interactions(lead_id);
CREATE INDEX idx_lead_quotes_lead_id ON lead_quotes(lead_id);
CREATE INDEX idx_lead_quotes_status ON lead_quotes(status);
