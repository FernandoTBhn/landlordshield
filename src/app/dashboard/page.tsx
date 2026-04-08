import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Property, Tenant, Certificate } from "@/lib/types";
import PostHogTracker from "./PostHogTracker";

type PropertyWithDetails = Property & {
  tenants: Pick<Tenant, "full_name" | "email" | "tenancy_type">[];
  certificates: Pick<Certificate, "cert_type" | "expiry_date" | "status">[];
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

  const items = (properties ?? []) as PropertyWithDetails[];

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
