import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { InfoSheetPDF } from "@/lib/pdf/info-sheet";
import React from "react";

export const dynamic = "force-dynamic";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const TENANCY_TYPE_LABELS: Record<string, string> = {
  ast_periodic: "AST Periodic (rolling)",
  fixed: "Fixed Term",
  other: "Other",
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json();
  const { propertyId, tenantId } = body;

  if (!propertyId || !tenantId) {
    return NextResponse.json(
      { error: "Missing propertyId or tenantId" },
      { status: 400 },
    );
  }

  // Fetch property
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .eq("user_id", user.id)
    .single();

  if (propErr || !property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // Fetch tenant
  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .eq("user_id", user.id)
    .single();

  if (tenantErr || !tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  if (!tenant.email) {
    return NextResponse.json(
      { error: "Tenant has no email address" },
      { status: 400 },
    );
  }

  const servedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Generate PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfElement = React.createElement(InfoSheetPDF, {
    landlordName: user.email ?? "Landlord",
    tenantName: tenant.full_name,
    propertyAddress: property.address_line_1,
    tenancyType:
      TENANCY_TYPE_LABELS[tenant.tenancy_type] ?? tenant.tenancy_type,
    tenancyStart: tenant.tenancy_start,
    depositAmount: tenant.deposit_amount?.toString() ?? "",
    depositScheme: tenant.deposit_scheme ?? "",
    depositRef: tenant.deposit_ref ?? "",
    servedDate,
  }) as any;
  const pdfBuffer = await renderToBuffer(pdfElement);

  // Insert info sheet record (pending)
  const { data: record, error: insertErr } = await supabase
    .from("information_sheet_records")
    .insert({
      user_id: user.id,
      tenant_id: tenantId,
      property_id: propertyId,
      served_date: new Date().toISOString().split("T")[0],
      method: "email",
      email_status: "pending",
    })
    .select("id")
    .single();

  if (insertErr || !record) {
    return NextResponse.json(
      { error: "Could not create record" },
      { status: 500 },
    );
  }

  // Send email via Resend
  const { error: emailErr } = await getResend().emails.send({
    from: "LandlordShield <noreply@landlordshield.co.uk>",
    to: tenant.email,
    subject: `Prescribed Information — ${property.address_line_1}`,
    text: `Dear ${tenant.full_name},\n\nPlease find attached the prescribed information for your tenancy deposit at ${property.address_line_1}.\n\nThis is provided in accordance with the Housing Act 2004.\n\nRegards,\nYour Landlord`,
    attachments: [
      {
        filename: "Prescribed-Information.pdf",
        content: pdfBuffer,
      },
    ],
  });

  // Update record status
  if (emailErr) {
    await supabase
      .from("information_sheet_records")
      .update({ email_status: "failed" })
      .eq("id", record.id);

    return NextResponse.json(
      { error: "Email failed to send. Record saved as failed." },
      { status: 500 },
    );
  }

  await supabase
    .from("information_sheet_records")
    .update({ email_status: "sent", sent_at: new Date().toISOString() })
    .eq("id", record.id);

  // Check if this is the first info sheet (for activation milestone)
  const { count } = await supabase
    .from("information_sheet_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("email_status", "sent");

  return NextResponse.json({
    success: true,
    recordId: record.id,
    isFirstInfoSheet: count === 1,
  });
}
