// Compliance Score Engine
// Calculates a 0–100 score per property based on:
//   - Information Sheet served:   30%
//   - Certificates valid:         50% (10% each for 5 required certs)
//   - Tenancy type updated:       20%

import type { CertStatus, TenancyType } from "./types";

const REQUIRED_CERTS = [
  "gas_safety",
  "eicr",
  "epc",
  "deposit_protection",
  "smoke_co",
] as const;

type CertSummary = { cert_type: string; status: CertStatus };

export type ComplianceScore = {
  total: number;
  infoSheet: number;
  certificates: number;
  tenancyType: number;
};

export function calculateComplianceScore(opts: {
  hasInfoSheetServed: boolean;
  certificates: CertSummary[];
  tenancyType: TenancyType | null;
}): ComplianceScore {
  // Info sheet: 30 points if served
  const infoSheet = opts.hasInfoSheetServed ? 30 : 0;

  // Certificates: 10 points each for 5 required certs (50 total)
  // Only valid certs get full points; expiring_soon gets 5 points
  let certificates = 0;
  for (const reqType of REQUIRED_CERTS) {
    const cert = opts.certificates.find((c) => c.cert_type === reqType);
    if (cert) {
      if (cert.status === "valid") certificates += 10;
      else if (cert.status === "expiring_soon") certificates += 5;
      // expired = 0
    }
  }

  // Tenancy type: 20 points if set (not default 'other' placeholder)
  const tenancyType = opts.tenancyType && opts.tenancyType !== "other" ? 20 : 0;

  return {
    total: infoSheet + certificates + tenancyType,
    infoSheet,
    certificates,
    tenancyType,
  };
}

export function getScoreColour(score: number): {
  bar: string;
  text: string;
  label: string;
} {
  if (score >= 80) return { bar: "bg-success", text: "text-success", label: "Good" };
  if (score >= 50) return { bar: "bg-warning", text: "text-warning", label: "Needs attention" };
  return { bar: "bg-danger", text: "text-danger", label: "Action required" };
}
