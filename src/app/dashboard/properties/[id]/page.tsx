import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Certificate } from "@/lib/types";
import CertificateRow from "./CertificateRow";
import SendInfoSheetButton from "./SendInfoSheetButton";

const CERT_CHECKLIST = [
  { type: "gas_safety", label: "Gas Safety (CP12)" },
  { type: "eicr", label: "Electrical Safety (EICR)" },
  { type: "epc", label: "Energy Performance (EPC)" },
  { type: "deposit_protection", label: "Deposit Protection" },
  { type: "smoke_co", label: "Smoke & CO Alarms" },
] as const;

type TrafficLight = "green" | "yellow" | "red" | "none";

function getCertLight(cert: Certificate | undefined): {
  light: TrafficLight;
  daysLeft: number | null;
} {
  if (!cert) return { light: "none", daysLeft: null };

  const now = new Date();
  const expiry = new Date(cert.expiry_date);
  const daysLeft = Math.floor(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysLeft < 0) return { light: "red", daysLeft };
  if (daysLeft <= 60) return { light: "yellow", daysLeft };
  return { light: "green", daysLeft };
}

const TENANCY_TYPE_LABELS: Record<string, string> = {
  ast_periodic: "AST Periodic (rolling)",
  fixed: "Fixed Term",
  other: "Other",
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch property
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!property) notFound();

  // Fetch tenant
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .eq("property_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const tenant = tenants?.[0] ?? null;

  // Fetch certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select("*")
    .eq("property_id", id)
    .eq("user_id", user.id);

  const certs = (certificates ?? []) as Certificate[];

  // Build map of cert_type -> Certificate
  const certMap = new Map<string, Certificate>();
  for (const c of certs) {
    certMap.set(c.cert_type, c);
  }

  // Check if info sheet has been sent before
  const { count: infoSheetCount } = await supabase
    .from("information_sheet_records")
    .select("id", { count: "exact", head: true })
    .eq("property_id", id)
    .eq("user_id", user.id)
    .eq("email_status", "sent");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-base font-medium text-primary hover:underline mb-8"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to Dashboard
      </Link>

      {/* Property header */}
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {property.address_line_1 || property.name}
        </h1>
        {tenant && (
          <p className="text-lg text-muted">
            Tenant: <strong className="text-foreground">{tenant.full_name}</strong>
            {tenant.tenancy_type && (
              <span className="ml-2 text-base">
                — {TENANCY_TYPE_LABELS[tenant.tenancy_type] ?? tenant.tenancy_type}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Send Info Sheet */}
      {tenant && (
        <section className="mb-10" aria-labelledby="info-sheet-heading">
          <h2 id="info-sheet-heading" className="sr-only">
            Information Sheet
          </h2>
          <SendInfoSheetButton
            propertyId={id}
            tenantId={tenant.id}
            tenantEmail={tenant.email}
            tenantName={tenant.full_name}
            hasSentBefore={(infoSheetCount ?? 0) > 0}
          />
        </section>
      )}

      {/* Certificate checklist */}
      <section aria-labelledby="certs-heading">
        <h2
          id="certs-heading"
          className="text-xl sm:text-2xl font-bold mb-6"
        >
          Compliance Checklist
        </h2>
        <div className="flex flex-col gap-6">
          {CERT_CHECKLIST.map(({ type, label }) => {
            const cert = certMap.get(type);
            const { light, daysLeft } = getCertLight(cert);

            return (
              <CertificateRow
                key={type}
                propertyId={id}
                certType={type}
                label={label}
                issuedDate={cert?.issued_date ?? null}
                expiryDate={cert?.expiry_date ?? null}
                light={light}
                daysLeft={daysLeft}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
