-- =============================================================
-- PROPERTIES
-- =============================================================
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  postcode text not null,
  property_type text not null default 'house',
  bedrooms smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties enable row level security;

create policy "Users can view own properties"
  on public.properties for select
  using (auth.uid() = user_id);

create policy "Users can insert own properties"
  on public.properties for insert
  with check (auth.uid() = user_id);

create policy "Users can update own properties"
  on public.properties for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own properties"
  on public.properties for delete
  using (auth.uid() = user_id);

-- =============================================================
-- TENANTS
-- =============================================================
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  tenancy_start date not null,
  tenancy_end date,
  deposit_amount numeric(10,2),
  deposit_scheme text,
  deposit_ref text,
  right_to_rent_checked boolean not null default false,
  right_to_rent_date date,
  right_to_rent_expiry date,
  tenancy_type text not null default 'ast_periodic',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint tenants_tenancy_type_check check (
    tenancy_type in ('ast_periodic', 'fixed', 'other')
  )
);

alter table public.tenants enable row level security;

create policy "Users can view own tenants"
  on public.tenants for select
  using (auth.uid() = user_id);

create policy "Users can insert own tenants"
  on public.tenants for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tenants"
  on public.tenants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tenants"
  on public.tenants for delete
  using (auth.uid() = user_id);

-- =============================================================
-- INFORMATION SHEET RECORDS
-- =============================================================
create table public.information_sheet_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  served_date date not null,
  method text not null default 'in_person',
  notes text,
  sent_at timestamptz,
  email_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint info_sheet_email_status_check check (
    email_status in ('pending', 'sent', 'failed')
  )
);

alter table public.information_sheet_records enable row level security;

create policy "Users can view own information sheets"
  on public.information_sheet_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own information sheets"
  on public.information_sheet_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own information sheets"
  on public.information_sheet_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own information sheets"
  on public.information_sheet_records for delete
  using (auth.uid() = user_id);

-- =============================================================
-- CERTIFICATES
-- =============================================================
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  cert_type text not null,
  reference_number text,
  issued_date date not null,
  expiry_date date not null,
  status text not null default 'valid',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint certificates_cert_type_check check (
    cert_type in (
      'gas_safety', 'epc', 'eicr', 'pat', 'legionella',
      'fire_safety', 'deposit_protection', 'smoke_co', 'other'
    )
  ),
  constraint certificates_status_check check (
    status in ('valid', 'expiring_soon', 'expired')
  )
);

alter table public.certificates enable row level security;

create policy "Users can view own certificates"
  on public.certificates for select
  using (auth.uid() = user_id);

create policy "Users can insert own certificates"
  on public.certificates for insert
  with check (auth.uid() = user_id);

create policy "Users can update own certificates"
  on public.certificates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own certificates"
  on public.certificates for delete
  using (auth.uid() = user_id);

-- =============================================================
-- INDEXES
-- =============================================================
create index idx_properties_user_id on public.properties(user_id);
create index idx_tenants_user_id on public.tenants(user_id);
create index idx_tenants_property_id on public.tenants(property_id);
create index idx_information_sheet_records_user_id on public.information_sheet_records(user_id);
create index idx_information_sheet_records_tenant_id on public.information_sheet_records(tenant_id);
create index idx_certificates_user_id on public.certificates(user_id);
create index idx_certificates_property_id on public.certificates(property_id);
create index idx_certificates_expiry_date on public.certificates(expiry_date);

-- =============================================================
-- UPDATED_AT TRIGGER
-- =============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_properties_updated_at
  before update on public.properties
  for each row execute function public.handle_updated_at();

create trigger set_tenants_updated_at
  before update on public.tenants
  for each row execute function public.handle_updated_at();

create trigger set_information_sheet_records_updated_at
  before update on public.information_sheet_records
  for each row execute function public.handle_updated_at();

create trigger set_certificates_updated_at
  before update on public.certificates
  for each row execute function public.handle_updated_at();
