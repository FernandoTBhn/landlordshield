import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// This endpoint is designed to be called by a cron job (e.g. Vercel Cron).
// It checks all certificates for upcoming expiry and sends alert emails.

const ALERT_THRESHOLDS = [14, 30, 60] as const;

const CERT_LABELS: Record<string, string> = {
  gas_safety: "Gas Safety (CP12)",
  eicr: "Electrical Safety (EICR)",
  epc: "Energy Performance (EPC)",
  deposit_protection: "Deposit Protection",
  smoke_co: "Smoke & CO Alarms",
  pat: "PAT Testing",
  legionella: "Legionella Risk",
  fire_safety: "Fire Safety",
  other: "Other Certificate",
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service role config");
  return createServiceClient(url, key);
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

type CertWithContext = {
  id: string;
  cert_type: string;
  expiry_date: string;
  status: string;
  user_id: string;
  property_id: string;
  properties: { address_line_1: string } | null;
};

export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorised calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const resend = getResend();
  const now = new Date();

  const results = { checked: 0, updated: 0, emailsSent: 0, errors: [] as string[] };

  // Fetch all certificates that are not yet expired
  const { data: certs, error: fetchErr } = await supabase
    .from("certificates")
    .select("id, cert_type, expiry_date, status, user_id, property_id, properties(address_line_1)")
    .in("status", ["valid", "expiring_soon"]);

  if (fetchErr) {
    return NextResponse.json(
      { error: "Failed to fetch certificates", detail: fetchErr.message },
      { status: 500 },
    );
  }

  const allCerts = (certs ?? []) as unknown as CertWithContext[];
  results.checked = allCerts.length;

  // Group certs by user for batched email sending
  const alertsByUser = new Map<
    string,
    { email: string; alerts: { cert: CertWithContext; daysLeft: number; threshold: number }[] }
  >();

  for (const cert of allCerts) {
    const expiry = new Date(cert.expiry_date);
    const daysLeft = Math.floor(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Determine new status
    let newStatus: string | null = null;
    if (daysLeft < 0) {
      newStatus = "expired";
    } else if (daysLeft <= 60) {
      newStatus = "expiring_soon";
    } else {
      newStatus = "valid";
    }

    // Update status if changed
    if (newStatus !== cert.status) {
      const { error: updateErr } = await supabase
        .from("certificates")
        .update({ status: newStatus })
        .eq("id", cert.id);

      if (updateErr) {
        results.errors.push(`Failed to update cert ${cert.id}: ${updateErr.message}`);
      } else {
        results.updated++;
      }
    }

    // Check if this cert hits an alert threshold
    const matchedThreshold = ALERT_THRESHOLDS.find((t) => daysLeft === t);
    if (matchedThreshold !== undefined) {
      if (!alertsByUser.has(cert.user_id)) {
        // Fetch user email
        const { data: userData } = await supabase.auth.admin.getUserById(cert.user_id);
        const email = userData?.user?.email;
        if (email) {
          alertsByUser.set(cert.user_id, { email, alerts: [] });
        }
      }
      const entry = alertsByUser.get(cert.user_id);
      if (entry) {
        entry.alerts.push({ cert, daysLeft, threshold: matchedThreshold });
      }
    }
  }

  // Send alert emails (one per user, batching all their alerts)
  for (const [, { email, alerts }] of alertsByUser) {
    if (alerts.length === 0) continue;

    const alertLines = alerts
      .map(({ cert, daysLeft }) => {
        const certLabel = CERT_LABELS[cert.cert_type] ?? cert.cert_type;
        const address =
          (cert.properties as { address_line_1: string } | null)?.address_line_1 ?? "Unknown property";
        return `- ${certLabel} at ${address}: expires in ${daysLeft} days (${cert.expiry_date})`;
      })
      .join("\n");

    const urgentCount = alerts.filter((a) => a.threshold <= 14).length;
    const subject = urgentCount > 0
      ? `URGENT: ${urgentCount} certificate${urgentCount > 1 ? "s" : ""} expiring within 14 days`
      : `Certificate expiry reminder — ${alerts.length} certificate${alerts.length > 1 ? "s" : ""} need attention`;

    const { error: emailErr } = await resend.emails.send({
      from: "LandlordShield <noreply@landlordshield.co.uk>",
      to: email,
      subject,
      text: [
        "Dear Landlord,",
        "",
        "The following certificates need your attention:",
        "",
        alertLines,
        "",
        "Please renew these certificates to stay compliant. You can manage them in your LandlordShield dashboard.",
        "",
        "Regards,",
        "LandlordShield",
      ].join("\n"),
    });

    if (emailErr) {
      results.errors.push(`Failed to email ${email}: ${emailErr.message}`);
    } else {
      results.emailsSent++;
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
  });
}
