import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ComplianceReportPDF } from "@/lib/pdf/compliance-report";
import { calculateComplianceScore } from "@/lib/compliance";
import type { Certificate, Tenant } from "@/lib/types";
import React from "react";

export const dynamic = "force-dynamic";

const TENANCY_TYPE_LABELS: Record<string, string> = {
  ast_periodic: "AST Periodic (rolling)",
  fixed: "Fixed Term",
  other: "Other",
};

export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json(
      { error: "Missing propertyId" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Fetch property
  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // Fetch tenant
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const tenant = (tenants?.[0] as Tenant) ?? null;

  // Fetch certificates
  const { data: certificates } = await supabase
    .from("certificates")
    .select("*")
    .eq("property_id", propertyId)
    .eq("user_id", user.id);

  const certs = (certificates ?? []) as Certificate[];

  // Fetch info sheet
  const { data: infoSheets } = await supabase
    .from("information_sheet_records")
    .select("served_date")
    .eq("property_id", propertyId)
    .eq("user_id", user.id)
    .eq("email_status", "sent")
    .order("served_date", { ascending: false })
    .limit(1);

  const infoSheetServed = (infoSheets?.length ?? 0) > 0;
  const infoSheetDate = infoSheets?.[0]?.served_date ?? null;

  // Compliance score
  const score = calculateComplianceScore({
    hasInfoSheetServed: infoSheetServed,
    certificates: certs,
    tenancyType: tenant?.tenancy_type ?? null,
  });

  const generatedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfElement = React.createElement(ComplianceReportPDF, {
    propertyAddress: property.address_line_1,
    city: property.city,
    postcode: property.postcode,
    tenantName: tenant?.full_name ?? null,
    tenancyType: tenant
      ? (TENANCY_TYPE_LABELS[tenant.tenancy_type] ?? tenant.tenancy_type)
      : null,
    complianceScore: score.total,
    certificates: certs.map((c) => ({
      cert_type: c.cert_type,
      issued_date: c.issued_date,
      expiry_date: c.expiry_date,
      status: c.status,
    })),
    infoSheetServed,
    infoSheetDate,
    generatedDate,
  }) as any;

  const pdfBuffer = await renderToBuffer(pdfElement);

  const filename = `compliance-report-${property.postcode.replace(/\s/g, "")}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
