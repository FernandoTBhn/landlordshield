import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const BRAND = "#1B365D";
const SUCCESS = "#2D8544";
const WARNING = "#D4A017";
const DANGER = "#C41E3A";
const MUTED = "#6B7280";
const BORDER = "#D1D5DB";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: BRAND,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    marginBottom: 10,
    color: BRAND,
  },
  generatedDate: {
    fontSize: 9,
    color: MUTED,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    width: 160,
  },
  value: {
    flex: 1,
  },
  // Score section
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  scoreNumber: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
  },
  scoreLabel: {
    fontSize: 12,
    marginLeft: 8,
    fontFamily: "Helvetica-Bold",
  },
  scoreBarOuter: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 5,
    marginTop: 4,
    marginBottom: 16,
  },
  scoreBarInner: {
    height: 10,
    borderRadius: 5,
  },
  // Certificate table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: MUTED,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  colName: { width: "35%" },
  colIssued: { width: "20%" },
  colExpiry: { width: "20%" },
  colStatus: { width: "25%" },
  statusBadge: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footer: {
    marginTop: 30,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    fontSize: 9,
    color: MUTED,
  },
});

const CERT_LABELS: Record<string, string> = {
  gas_safety: "Gas Safety (CP12)",
  eicr: "Electrical Safety (EICR)",
  epc: "Energy Performance (EPC)",
  deposit_protection: "Deposit Protection",
  smoke_co: "Smoke & CO Alarms",
  pat: "PAT Testing",
  legionella: "Legionella Risk",
  fire_safety: "Fire Safety",
  other: "Other",
};

const STATUS_STYLES: Record<string, { color: string; label: string }> = {
  valid: { color: SUCCESS, label: "Valid" },
  expiring_soon: { color: WARNING, label: "Expiring soon" },
  expired: { color: DANGER, label: "Expired" },
};

function getScoreColour(score: number) {
  if (score >= 80) return SUCCESS;
  if (score >= 50) return WARNING;
  return DANGER;
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Good";
  if (score >= 50) return "Needs attention";
  return "Action required";
}

type CertRow = {
  cert_type: string;
  issued_date: string | null;
  expiry_date: string | null;
  status: string;
};

export type ComplianceReportProps = {
  propertyAddress: string;
  city: string;
  postcode: string;
  tenantName: string | null;
  tenancyType: string | null;
  complianceScore: number;
  certificates: CertRow[];
  infoSheetServed: boolean;
  infoSheetDate: string | null;
  generatedDate: string;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ComplianceReportPDF(props: ComplianceReportProps) {
  const scoreColour = getScoreColour(props.complianceScore);
  const scoreLabel = getScoreLabel(props.complianceScore);

  const requiredTypes = [
    "gas_safety",
    "eicr",
    "epc",
    "deposit_protection",
    "smoke_co",
  ];

  // Show required certs first, then any extras
  const sortedCerts = [
    ...requiredTypes.map((type) => {
      const found = props.certificates.find((c) => c.cert_type === type);
      return found ?? { cert_type: type, issued_date: null, expiry_date: null, status: "missing" };
    }),
    ...props.certificates.filter((c) => !requiredTypes.includes(c.cert_type)),
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Compliance Report</Text>
        <Text style={styles.generatedDate}>
          Generated {props.generatedDate} by LandlordShield
        </Text>

        {/* Property details */}
        <Text style={styles.subtitle}>Property</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>{props.propertyAddress}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>City / Postcode:</Text>
          <Text style={styles.value}>
            {props.city}, {props.postcode}
          </Text>
        </View>

        {/* Tenant */}
        <Text style={styles.subtitle}>Tenant</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>
            {props.tenantName ?? "No tenant assigned"}
          </Text>
        </View>
        {props.tenancyType && (
          <View style={styles.row}>
            <Text style={styles.label}>Tenancy Type:</Text>
            <Text style={styles.value}>{props.tenancyType}</Text>
          </View>
        )}

        {/* Compliance score */}
        <Text style={styles.subtitle}>Compliance Score</Text>
        <View style={styles.scoreContainer}>
          <Text style={{ ...styles.scoreNumber, color: scoreColour }}>
            {props.complianceScore}%
          </Text>
          <Text style={{ ...styles.scoreLabel, color: scoreColour }}>
            {scoreLabel}
          </Text>
        </View>
        <View style={styles.scoreBarOuter}>
          <View
            style={{
              ...styles.scoreBarInner,
              width: `${props.complianceScore}%`,
              backgroundColor: scoreColour,
            }}
          />
        </View>

        {/* Info Sheet status */}
        <Text style={styles.subtitle}>Information Sheet (S.213)</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text
            style={{
              ...styles.value,
              color: props.infoSheetServed ? SUCCESS : DANGER,
              fontFamily: "Helvetica-Bold",
            }}
          >
            {props.infoSheetServed ? "Served" : "Not served"}
          </Text>
        </View>
        {props.infoSheetDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Last served:</Text>
            <Text style={styles.value}>{formatDate(props.infoSheetDate)}</Text>
          </View>
        )}

        {/* Certificate table */}
        <Text style={styles.subtitle}>Certificates</Text>
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.tableHeaderText, ...styles.colName }}>
            Certificate
          </Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colIssued }}>
            Issued
          </Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colExpiry }}>
            Expiry
          </Text>
          <Text style={{ ...styles.tableHeaderText, ...styles.colStatus }}>
            Status
          </Text>
        </View>
        {sortedCerts.map((cert, i) => {
          const statusInfo =
            cert.status === "missing"
              ? { color: DANGER, label: "Not recorded" }
              : STATUS_STYLES[cert.status] ?? { color: MUTED, label: cert.status };

          return (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colName}>
                {CERT_LABELS[cert.cert_type] ?? cert.cert_type}
              </Text>
              <Text style={styles.colIssued}>
                {formatDate(cert.issued_date)}
              </Text>
              <Text style={styles.colExpiry}>
                {formatDate(cert.expiry_date)}
              </Text>
              <Text
                style={{
                  ...styles.statusBadge,
                  color: statusInfo.color,
                }}
              >
                {statusInfo.label}
              </Text>
            </View>
          );
        })}

        <Text style={styles.footer}>
          This report is for record-keeping purposes. It does not constitute
          legal advice. Always consult relevant legislation and professional
          advisers. Generated by LandlordShield.
        </Text>
      </Page>
    </Document>
  );
}
