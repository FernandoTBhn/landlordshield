-- Add tenancy_type to tenants table
-- Values: ast_periodic, fixed, other

alter table public.tenants
  add column tenancy_type text not null default 'ast_periodic';

alter table public.tenants
  add constraint tenants_tenancy_type_check check (
    tenancy_type in ('ast_periodic', 'fixed', 'other')
  );
