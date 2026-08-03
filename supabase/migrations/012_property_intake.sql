-- Property intake form responses & onboarding
create table if not exists property_intake (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,

  -- Contact info
  customer_name text not null,
  customer_email text not null,
  customer_phone text,

  -- Property details
  address text not null,
  property_size text, -- "small (<5k)", "medium (5-15k)", "large (15-30k)", "very_large (30k+)"
  grass_type text, -- references grass slug or null if unknown
  current_condition text, -- "perfect", "good", "fair", "poor"

  -- Issues (can have multiple)
  issues jsonb default '[]'::jsonb, -- ["weeds", "bare_spots", "compaction", "thin", "moss", "thatch"]

  -- Budget & preference
  service_level text, -- "basic", "standard", "premium"
  availability text, -- day/time preferences as text

  -- Photos
  photo_urls text[] default '{}',

  -- Generated recommendations
  recommended_services jsonb, -- auto-generated array of recommended services
  estimated_monthly_cost numeric,

  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table property_intake enable row level security;

create policy "company_read_own_intake" on property_intake
  for select using (company_id = current_setting('app.company_id')::uuid);

create policy "company_insert_own_intake" on property_intake
  for insert with check (company_id = current_setting('app.company_id')::uuid);

create policy "company_update_own_intake" on property_intake
  for update using (company_id = current_setting('app.company_id')::uuid);

-- Public function to accept new property intake (before auth)
create or replace function submit_property_intake(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_address text,
  p_property_size text,
  p_grass_type text,
  p_current_condition text,
  p_issues jsonb,
  p_service_level text,
  p_availability text
)
returns jsonb as $$
declare
  v_company_id uuid;
  v_intake_id uuid;
begin
  -- Get company from current setting (set in middleware)
  v_company_id := current_setting('app.company_id')::uuid;

  insert into property_intake (
    company_id, customer_name, customer_email, customer_phone,
    address, property_size, grass_type, current_condition,
    issues, service_level, availability
  ) values (
    v_company_id, p_customer_name, p_customer_email, p_customer_phone,
    p_address, p_property_size, p_grass_type, p_current_condition,
    p_issues, p_service_level, p_availability
  ) returning id into v_intake_id;

  return jsonb_build_object(
    'success', true,
    'intake_id', v_intake_id
  );
end;
$$ language plpgsql security definer;

create index idx_property_intake_company on property_intake(company_id);
create index idx_property_intake_email on property_intake(customer_email);
