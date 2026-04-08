"use client";

import { useActionState } from "react";
import { saveCertificate, type SaveCertState } from "./actions";

type TrafficLight = "green" | "yellow" | "red" | "none";

type Props = {
  propertyId: string;
  certType: string;
  label: string;
  issuedDate: string | null;
  expiryDate: string | null;
  light: TrafficLight;
  daysLeft: number | null;
};

const lightConfig: Record<
  TrafficLight,
  { dot: string; bg: string; text: string; label: string }
> = {
  green: {
    dot: "bg-success",
    bg: "bg-success/10",
    text: "text-success",
    label: "Compliant",
  },
  yellow: {
    dot: "bg-warning",
    bg: "bg-warning/10",
    text: "text-warning",
    label: "Expiring soon",
  },
  red: {
    dot: "bg-danger",
    bg: "bg-danger/10",
    text: "text-danger",
    label: "Expired",
  },
  none: {
    dot: "bg-muted",
    bg: "bg-muted/10",
    text: "text-muted",
    label: "Not recorded",
  },
};

export default function CertificateRow({
  propertyId,
  certType,
  label,
  issuedDate,
  expiryDate,
  light,
  daysLeft,
}: Props) {
  const [state, formAction, isPending] = useActionState<SaveCertState, FormData>(
    saveCertificate,
    {},
  );

  const cfg = lightConfig[light];

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* Header: name + traffic light */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">{label}</h3>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${cfg.bg}`}
        >
          <span
            className={`block h-3 w-3 rounded-full ${cfg.dot}`}
            aria-hidden="true"
          />
          <span className={`text-sm font-semibold ${cfg.text}`}>
            {light === "none"
              ? cfg.label
              : daysLeft !== null && daysLeft >= 0
                ? `${daysLeft} days left`
                : cfg.label}
          </span>
        </div>
      </div>

      {/* Form */}
      <form action={formAction}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="certType" value={certType} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label
              htmlFor={`${certType}-issued`}
              className="block text-base font-medium mb-2"
            >
              Issued Date
            </label>
            <input
              id={`${certType}-issued`}
              name="issuedDate"
              type="date"
              defaultValue={issuedDate ?? ""}
              className="w-full h-[48px] rounded-lg border border-border bg-card px-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <div>
            <label
              htmlFor={`${certType}-expiry`}
              className="block text-base font-medium mb-2"
            >
              Expiry Date
            </label>
            <input
              id={`${certType}-expiry`}
              name="expiryDate"
              type="date"
              defaultValue={expiryDate ?? ""}
              className="w-full h-[48px] rounded-lg border border-border bg-card px-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {state.error && (
          <p className="text-base text-danger mb-3" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-base text-success mb-3" role="status">
            Saved successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="h-[48px] rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : issuedDate ? "Update" : "Save"}
        </button>
      </form>
    </div>
  );
}
