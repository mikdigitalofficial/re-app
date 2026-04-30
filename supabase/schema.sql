create extension if not exists "uuid-ossp";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null default 'PROJECT_NAME',
  full_name text,
  role text default 'owner',
  whatsapp_number text,
  created_at timestamptz not null default now()
);

create table public.agents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null,
  phone text,
  avatar text,
  monthly_target integer not null default 5,
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  nationality text,
  budget numeric not null default 0,
  property_type text not null,
  area_preference text not null,
  source text not null,
  status text not null default 'New Lead',
  assigned_agent text,
  notes text,
  last_contacted date,
  hot_score integer not null default 0,
  closings_value numeric,
  campaign_name text,
  ad_set text,
  ad_name text,
  platform text,
  timeline text,
  language text,
  utm_source text,
  synced_at timestamptz,
  first_response_at timestamptz,
  ad_spend numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_sync_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  platform text not null,
  source text not null,
  campaign_name text,
  payload jsonb not null default '{}'::jsonb,
  assigned_agent text,
  status text not null default 'Created',
  hot_score integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.campaign_performance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  source text not null,
  campaign_name text not null,
  ad_set text,
  spend numeric not null default 0,
  leads integer not null default 0,
  closed_won integer not null default 0,
  revenue numeric not null default 0,
  reporting_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.integration_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  account_name text,
  status text not null default 'Not Connected',
  webhook_secret text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  alert_type text not null,
  recipient text,
  channel text not null,
  status text not null default 'Queued',
  created_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  ticket_number text not null unique default ('TKT-' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8))),
  company_id uuid,
  company_name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_by_name text,
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_to_name text,
  subject text not null,
  description text not null,
  category text not null check (category in ('Technical Issue', 'Lead Sync Problem', 'Billing', 'User Access', 'Complaint', 'Feature Request', 'General Support')),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status text not null default 'Open' check (status in ('Open', 'In Progress', 'Waiting Client', 'Resolved', 'Closed')),
  attachments jsonb not null default '[]'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  body text not null,
  is_internal boolean not null default false,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.whatsapp_templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.follow_up_reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  reminder_type text not null,
  due_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.offplan_launches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project text not null,
  developer text not null,
  area text not null,
  launch_date date not null,
  starting_price numeric not null,
  inventory text,
  status text not null default 'Teaser',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.leads enable row level security;
alter table public.whatsapp_templates enable row level security;
alter table public.follow_up_reminders enable row level security;
alter table public.offplan_launches enable row level security;
alter table public.lead_sync_events enable row level security;
alter table public.campaign_performance enable row level security;
alter table public.integration_connections enable row level security;
alter table public.notification_events enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Admins can read support staff profiles" on public.profiles for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'owner')
  )
);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can manage own agents" on public.agents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own leads" on public.leads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own templates" on public.whatsapp_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own reminders" on public.follow_up_reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own launches" on public.offplan_launches for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own sync events" on public.lead_sync_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own campaign performance" on public.campaign_performance for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own integration connections" on public.integration_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own notification events" on public.notification_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Support ticket read access" on public.support_tickets
for select using (
  created_by = auth.uid()
  or assigned_to = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p.role in ('admin', 'owner')
        or (p.role = 'staff' and support_tickets.assigned_to = auth.uid())
        or p.company_name = support_tickets.company_name
      )
  )
);

create policy "Company users can create support tickets" on public.support_tickets
for insert with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.company_name = support_tickets.company_name
  )
);

create policy "Admins and assigned staff can update support tickets" on public.support_tickets
for update using (
  assigned_to = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'owner')
  )
) with check (
  assigned_to = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'owner')
  )
);

create policy "Support message read access" on public.support_messages
for select using (
  exists (
    select 1
    from public.support_tickets t
    left join public.profiles p on p.id = auth.uid()
    where t.id = support_messages.ticket_id
      and (
        t.created_by = auth.uid()
        or t.assigned_to = auth.uid()
        or p.role in ('admin', 'owner')
        or (p.role = 'staff' and t.assigned_to = auth.uid())
        or (p.company_name = t.company_name and support_messages.is_internal = false)
      )
      and (support_messages.is_internal = false or p.role in ('admin', 'owner', 'staff'))
  )
);

create policy "Support message insert access" on public.support_messages
for insert with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.support_tickets t
    left join public.profiles p on p.id = auth.uid()
    where t.id = support_messages.ticket_id
      and (
        t.created_by = auth.uid()
        or t.assigned_to = auth.uid()
        or p.role in ('admin', 'owner')
        or p.company_name = t.company_name
      )
      and (support_messages.is_internal = false or p.role in ('admin', 'owner', 'staff'))
  )
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create or replace function public.set_support_ticket_update_fields()
returns trigger as $$
begin
  new.updated_at = now();
  if new.status = 'Resolved' and old.status is distinct from 'Resolved' then
    new.resolved_at = now();
  end if;
  if new.status <> 'Resolved' and old.status = 'Resolved' then
    new.resolved_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger support_tickets_set_update_fields
before update on public.support_tickets
for each row execute function public.set_support_ticket_update_fields();

create or replace function public.touch_support_ticket_from_message()
returns trigger as $$
begin
  update public.support_tickets
  set updated_at = now()
  where id = new.ticket_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger support_messages_touch_ticket
after insert on public.support_messages
for each row execute function public.touch_support_ticket_from_message();

insert into storage.buckets (id, name, public)
values ('support-attachments', 'support-attachments', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload support attachments"
on storage.objects for insert
to authenticated
with check (bucket_id = 'support-attachments');

create policy "Authenticated users can read support attachments"
on storage.objects for select
to authenticated
using (bucket_id = 'support-attachments');

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, company_name, full_name)
  values (new.id, 'PROJECT_NAME', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
