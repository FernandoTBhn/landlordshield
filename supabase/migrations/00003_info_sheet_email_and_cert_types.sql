-- Add email tracking columns to information_sheet_records
alter table public.information_sheet_records
  add column sent_at timestamptz,
  add column email_status text not null default 'pending';

alter table public.information_sheet_records
  add constraint info_sheet_email_status_check check (
    email_status in ('pending', 'sent', 'failed')
  );

-- Expand certificate types to include deposit_protection and smoke_co
alter table public.certificates drop constraint certificates_cert_type_check;

alter table public.certificates
  add constraint certificates_cert_type_check check (
    cert_type in (
      'gas_safety', 'epc', 'eicr', 'pat', 'legionella',
      'fire_safety', 'deposit_protection', 'smoke_co', 'other'
    )
  );
