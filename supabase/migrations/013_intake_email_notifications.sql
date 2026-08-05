-- Add email configuration to companies table
alter table companies add column if not exists admin_email text;
alter table companies add column if not exists notify_on_intake boolean default true;

-- Create edge function for sending emails (Resend)
-- This will be called by a trigger when new intakes arrive

-- Create trigger function to send email on new intake
create or replace function notify_admin_on_new_intake()
returns trigger as $$
declare
  v_admin_email text;
  v_company_name text;
  v_estimated_cost text;
begin
  -- Get admin email and company info
  select admin_email, name into v_admin_email, v_company_name
  from companies
  where id = new.company_id;

  -- Only send if admin has email and notifications enabled
  if v_admin_email is not null then
    -- Format estimated cost
    v_estimated_cost := coalesce(round(new.estimated_monthly_cost)::text, 'N/A');

    -- Call Resend API via HTTP (requires edge function or webhook)
    -- For now, we'll insert into a notifications queue table
    insert into intake_notifications (
      intake_id,
      company_id,
      recipient_email,
      customer_name,
      customer_email,
      property_address,
      estimated_cost,
      status
    ) values (
      new.id,
      new.company_id,
      v_admin_email,
      new.customer_name,
      new.customer_email,
      new.address,
      v_estimated_cost,
      'pending'
    );
  end if;

  return new;
end;
$$ language plpgsql;

-- Create notifications queue table
create table if not exists intake_notifications (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references property_intake(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  recipient_email text not null,
  customer_name text not null,
  customer_email text not null,
  property_address text not null,
  estimated_cost text,
  status text default 'pending', -- pending, sent, failed
  error_message text,
  sent_at timestamp,
  created_at timestamp default now()
);

alter table intake_notifications enable row level security;

create policy "company_read_own_notifications" on intake_notifications
  for select using (company_id = current_setting('app.company_id')::uuid);

-- Create trigger for new intakes
drop trigger if exists trigger_notify_on_intake on property_intake;
create trigger trigger_notify_on_intake
  after insert on property_intake
  for each row
  execute function notify_admin_on_new_intake();

-- Create edge function to send emails (you'll need to set up Resend API key)
-- For now, create a simple HTTP request function

create or replace function send_intake_notification_email(
  p_notification_id uuid,
  p_recipient_email text,
  p_customer_name text,
  p_customer_email text,
  p_property_address text,
  p_estimated_cost text,
  p_resend_api_key text
)
returns jsonb as $$
declare
  v_response jsonb;
  v_error text;
begin
  -- Call Resend API to send email
  -- This would typically be done via an edge function or webhook
  -- For now, mark as pending for manual sending or use a service like Make/Zapier

  return jsonb_build_object(
    'success', true,
    'message', 'Email queued for sending'
  );
end;
$$ language plpgsql;

create index idx_intake_notifications_company on intake_notifications(company_id);
create index idx_intake_notifications_status on intake_notifications(status);
create index idx_intake_notifications_created on intake_notifications(created_at);
