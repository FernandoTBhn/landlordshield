-- MTD Records — stores quarterly export history
create table public.mtd_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_year text not null,
  quarter text not null,
  income_type text not null default 'property',
  total_income numeric(12,2) not null default 0,
  total_expenses numeric(12,2) not null default 0,
  net_profit numeric(12,2) not null default 0,
  transaction_count integer not null default 0,
  status text not null default 'exported',
  exported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mtd_records_status_check check (
    status in ('in_progress', 'exported')
  ),
  constraint mtd_records_quarter_check check (
    quarter in ('Q1', 'Q2', 'Q3', 'Q4')
  )
);

alter table public.mtd_records enable row level security;

create policy "Users can view own mtd records"
  on public.mtd_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own mtd records"
  on public.mtd_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mtd records"
  on public.mtd_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own mtd records"
  on public.mtd_records for delete
  using (auth.uid() = user_id);

create index idx_mtd_records_user_id on public.mtd_records(user_id);
create index idx_mtd_records_tax_year_quarter on public.mtd_records(user_id, tax_year, quarter);

create trigger set_mtd_records_updated_at
  before update on public.mtd_records
  for each row execute function public.handle_updated_at();
