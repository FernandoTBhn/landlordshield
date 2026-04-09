import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Property, Tenant, Certificate, MtdRecord } from "@/lib/types";
import {
  calculateComplianceScore,
  getScoreColour,
  type ComplianceScore,
} from "@/lib/compliance";
import PostHogTracker from "./PostHogTracker";

type PropertyWithDetails = Property & {
  tenants: Pick<Tenant, "full_name" | "email" | "tenancy_type">[];
  certificates: Pick<Certificate, "cert_type" | "expiry_date" | "status">[];
  complianceScore?: ComplianceScore;
};

type TrafficLight = "green" | "yellow" | "red";

function getTrafficLight(certs: PropertyWithDetails["certificates"]): TrafficLight {
  if (certs.length === 0) return "red";
  const hasExpired = certs.some((c) => c.status === "expired");
  if (hasExpired) return "red";
  const hasExpiring = certs.some((c) => c.status === "expiring_soon");
  if (hasExpiring) return "yellow";
  return "green";
}

function getStatusLabel(light: TrafficLight): string {
  switch (light) {
    case "green":
      return "All compliant";
    case "yellow":
      return "Attention needed";
    case "red":
      return "Action required";
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: properties } = await supabase
    .from("properties")
    .select(
      "*, tenants(full_name, email, tenancy_type), certificates(cert_type, expiry_date, status)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const raw = (properties ?? []) as PropertyWithDetails[];

  // Fetch info-sheet counts per property (for compliance score)
  const { data: infoSheets } = await supabase
    .from("information_sheet_records")
    .select("property_id")
    .eq("user_id", user.id)
    .eq("email_status", "sent");

  const servedPropertyIds = new Set(
    (infoSheets ?? []).map((r: { property_id: string }) => r.property_id),
  );

  // Fetch aggregate counters for history card
  const { count: totalCerts } = await supabase
    .from("certificates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: totalInfoSheets } = await supabase
    .from("information_sheet_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("email_status", "sent");

  // Compute compliance scores
  const items = raw.map((p) => ({
    ...p,
    complianceScore: calculateComplianceScore({
      hasInfoSheetServed: servedPropertyIds.has(p.id),
      certificates: p.certificates,
      tenancyType: p.tenants[0]?.tenancy_type ?? null,
    }),
  }));

  // Fetch MTD records for current tax year
  const { data: mtdRecords } = await supabase
    .from("mtd_records")
    .select("quarter, status, exported_at, total_income, total_expenses, net_profit")
    .eq("user_id", user.id)
    .order("exported_at", { ascending: false });

  const mtdData = (mtdRecords ?? []) as Pick<MtdRecord, "quarter" | "status" | "exported_at" | "total_income" | "total_expenses" | "net_profit">[];

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <Suspense>
        <PostHogTracker />
      </Suspense>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Your Properties</h1>
          <p className="text-base text-muted mt-1">
            {items.length === 0
              ? "You haven't added any properties yet."
              : `${items.length} ${items.length === 1 ? "property" : "properties"} tracked`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/mtd"
            className="inline-flex h-[48px] items-center justify-center rounded-lg border-2 border-primary px-6 text-base font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            MTD Tax Prep
          </Link>
          <Link
            href="/dashboard/properties/new"
            className="inline-flex h-[48px] items-center justify-center rounded-lg bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + Add Property
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && <EmptyState />}

      {/* Property cards */}
      {items.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {/* MTD Tax Status */}
      <MtdStatus records={mtdData} />

      {/* Your Compliance History */}
      <ComplianceHistory
        propertiesCount={items.length}
        certificatesCount={totalCerts ?? 0}
        infoSheetsCount={totalInfoSheets ?? 0}
        memberSince={memberSince}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-card p-10 sm:p-16 text-center">
      {/* House icon */}
      <svg
        className="mx-auto mb-6 text-muted"
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
      <h2 className="text-xl sm:text-2xl font-bold mb-3">
        No properties yet
      </h2>
      <p className="text-lg text-muted mb-8 max-w-md mx-auto leading-relaxed">
        Add your first rental property to start tracking compliance — gas
        safety, EPC, deposit protection and more.
      </p>
      <Link
        href="/dashboard/properties/new"
        className="inline-flex h-[48px] items-center justify-center rounded-lg bg-primary px-10 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        + Add Your First Property
      </Link>
    </div>
  );
}

function PropertyCard({ property }: { property: PropertyWithDetails }) {
  const tenant = property.tenants[0];
  const light = getTrafficLight(property.certificates);
  const label = getStatusLabel(light);

  const lightColours: Record<TrafficLight, { bg: string; dot: string; text: string }> = {
    green: {
      bg: "bg-success/10 border-success/30",
      dot: "bg-success",
      text: "text-success",
    },
    yellow: {
      bg: "bg-warning/10 border-warning/30",
      dot: "bg-warning",
      text: "text-warning",
    },
    red: {
      bg: "bg-danger/10 border-danger/30",
      dot: "bg-danger",
      text: "text-danger",
    },
  };

  const colours = lightColours[light];

  return (
    <Link
      href={`/dashboard/properties/${property.id}`}
      className="block rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex flex-col gap-4">
        {/* Traffic light badge */}
        <div
          className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 ${colours.bg}`}
        >
          <span
            className={`block h-3 w-3 rounded-full ${colours.dot}`}
            aria-hidden="true"
          />
          <span className={`text-sm font-semibold ${colours.text}`}>
            {label}
          </span>
        </div>

        {/* Address */}
        <h2 className="text-lg font-bold leading-snug">
          {property.address_line_1 || property.name}
        </h2>

        {/* Tenant */}
        {tenant ? (
          <div className="text-base text-muted">
            <p className="font-medium text-foreground">{tenant.full_name}</p>
            {tenant.email && (
              <p className="truncate">{tenant.email}</p>
            )}
          </div>
        ) : (
          <p className="text-base text-muted italic">No tenant assigned</p>
        )}

        {/* Compliance score bar */}
        {property.complianceScore && (
          <ComplianceBar score={property.complianceScore.total} />
        )}

        {/* Certificates summary */}
        <div className="mt-auto pt-4 border-t border-border">
          {property.certificates.length === 0 ? (
            <p className="text-sm text-danger font-medium">
              No certificates — add them to stay compliant
            </p>
          ) : (
            <p className="text-sm text-muted">
              {property.certificates.length}{" "}
              {property.certificates.length === 1
                ? "certificate"
                : "certificates"}{" "}
              on file
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function ComplianceBar({ score }: { score: number }) {
  const { bar, text, label } = getScoreColour(score);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">Compliance</span>
        <span className={`text-sm font-bold ${text}`}>
          {score}% — {label}
        </span>
      </div>
      <div
        className="h-2.5 w-full rounded-full bg-border overflow-hidden"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Compliance score: ${score}%`}
      >
        <div
          className={`h-full rounded-full transition-all ${bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ComplianceHistory({
  propertiesCount,
  certificatesCount,
  infoSheetsCount,
  memberSince,
}: {
  propertiesCount: number;
  certificatesCount: number;
  infoSheetsCount: number;
  memberSince: string | null;
}) {
  const stats = [
    {
      label: "Properties tracked",
      value: propertiesCount,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          <path d="M9 21V12h6v9" />
        </svg>
      ),
    },
    {
      label: "Documents stored",
      value: certificatesCount + infoSheetsCount,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      label: "Certificates tracked",
      value: certificatesCount,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      label: "Info Sheets served",
      value: infoSheetsCount,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
  ];

  return (
    <section className="mt-10" aria-labelledby="history-heading">
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <h2 id="history-heading" className="text-xl sm:text-2xl font-bold mb-6">
          Your Compliance History
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-start gap-3">
              <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2.5">
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
        {memberSince && (
          <p className="mt-6 pt-4 border-t border-border text-base text-muted">
            Member since <strong className="text-foreground">{memberSince}</strong>
          </p>
        )}
      </div>
    </section>
  );
}

function MtdStatus({
  records,
}: {
  records: Pick<import("@/lib/types").MtdRecord, "quarter" | "status" | "exported_at" | "total_income" | "total_expenses" | "net_profit">[];
}) {
  const quarters = [
    { value: "Q1", label: "Q1", deadline: "5 Aug" },
    { value: "Q2", label: "Q2", deadline: "5 Nov" },
    { value: "Q3", label: "Q3", deadline: "5 Feb" },
    { value: "Q4", label: "Q4", deadline: "5 May" },
  ];

  const recordMap = new Map(records.map((r) => [r.quarter, r]));

  // Determine next deadline
  const now = new Date();
  const year = now.getFullYear();
  const deadlineDates = [
    { q: "Q1", date: new Date(year, 7, 5) },  // 5 Aug
    { q: "Q2", date: new Date(year, 10, 5) }, // 5 Nov
    { q: "Q3", date: new Date(year + 1, 1, 5) }, // 5 Feb next year
    { q: "Q4", date: new Date(year + 1, 4, 5) }, // 5 May next year
  ];

  const nextDeadline = deadlineDates.find((d) => d.date > now);
  const nextQ = nextDeadline
    ? quarters.find((q) => q.value === nextDeadline.q)
    : null;

  const daysUntilNext = nextDeadline
    ? Math.ceil((nextDeadline.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <section className="mt-10" aria-labelledby="mtd-heading">
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 id="mtd-heading" className="text-xl sm:text-2xl font-bold">
              Making Tax Digital
            </h2>
            {nextQ && daysUntilNext !== null && (
              <p className="text-base text-muted mt-1">
                Next deadline: <strong className="text-foreground">{nextQ.label} — {nextQ.deadline}</strong>
                <span className={`ml-2 font-semibold ${daysUntilNext <= 30 ? "text-danger" : daysUntilNext <= 60 ? "text-warning" : "text-muted"}`}>
                  ({daysUntilNext} days)
                </span>
              </p>
            )}
          </div>
          <Link
            href="/dashboard/mtd"
            className="inline-flex h-[48px] items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 shrink-0"
          >
            Open MTD Tax Prep
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quarters.map((q) => {
            const record = recordMap.get(q.value);
            const status: "exported" | "in_progress" | "not_started" = record
              ? (record.status as "exported" | "in_progress")
              : "not_started";

            const config = {
              exported: {
                dot: "bg-success",
                bg: "border-success/30 bg-success/[0.04]",
                text: "text-success",
                label: "Exported",
              },
              in_progress: {
                dot: "bg-warning",
                bg: "border-warning/30 bg-warning/[0.04]",
                text: "text-warning",
                label: "In progress",
              },
              not_started: {
                dot: "bg-muted/40",
                bg: "border-border",
                text: "text-muted",
                label: "Not started",
              },
            }[status];

            return (
              <div
                key={q.value}
                className={`rounded-lg border p-4 ${config.bg}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-3 w-3 rounded-full ${config.dot}`} aria-hidden="true" />
                  <span className="text-lg font-bold">{q.label}</span>
                </div>
                <p className={`text-sm font-semibold ${config.text}`}>{config.label}</p>
                <p className="text-xs text-muted mt-0.5">Due {q.deadline}</p>
                {record && status === "exported" && (
                  <p className="text-xs text-muted mt-1">
                    £{Number(record.net_profit).toLocaleString("en-GB", { minimumFractionDigits: 2 })} net
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="h-[48px] rounded-lg border-2 border-primary px-6 text-base font-semibold text-primary transition-colors hover:bg-primary/5"
      >
        Sign Out
      </button>
    </form>
  );
}
