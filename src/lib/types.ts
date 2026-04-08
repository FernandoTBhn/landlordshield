// Database row types — mirror the Supabase schema

export type Property = {
  id: string;
  user_id: string;
  name: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
  property_type: string;
  bedrooms: number;
  created_at: string;
  updated_at: string;
};

export type TenancyType = "ast_periodic" | "fixed" | "other";

export type Tenant = {
  id: string;
  user_id: string;
  property_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  tenancy_start: string;
  tenancy_end: string | null;
  tenancy_type: TenancyType;
  deposit_amount: number | null;
  deposit_scheme: string | null;
  deposit_ref: string | null;
  right_to_rent_checked: boolean;
  right_to_rent_date: string | null;
  right_to_rent_expiry: string | null;
  created_at: string;
  updated_at: string;
};

export type InfoSheetEmailStatus = "pending" | "sent" | "failed";

export type InformationSheetRecord = {
  id: string;
  user_id: string;
  tenant_id: string;
  property_id: string;
  served_date: string;
  method: string;
  notes: string | null;
  sent_at: string | null;
  email_status: InfoSheetEmailStatus;
  created_at: string;
  updated_at: string;
};

export type CertType =
  | "gas_safety"
  | "epc"
  | "eicr"
  | "pat"
  | "legionella"
  | "fire_safety"
  | "deposit_protection"
  | "smoke_co"
  | "other";

export type CertStatus = "valid" | "expiring_soon" | "expired";

export type Certificate = {
  id: string;
  user_id: string;
  property_id: string;
  cert_type: CertType;
  reference_number: string | null;
  issued_date: string;
  expiry_date: string;
  status: CertStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
