"use client";

import { useState } from "react";
import { trackActivationMilestone } from "@/lib/posthog";

type Props = {
  propertyId: string;
  tenantId: string;
  tenantEmail: string | null;
  tenantName: string;
  hasSentBefore: boolean;
};

export default function SendInfoSheetButton({
  propertyId,
  tenantId,
  tenantEmail,
  tenantName,
  hasSentBefore,
}: Props) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "sent" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSend() {
    if (!tenantEmail) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/info-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, tenantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong.");
        return;
      }

      setStatus("sent");

      // PostHog: activation milestone on first info sheet
      if (data.isFirstInfoSheet) {
        trackActivationMilestone(propertyId, tenantId);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (!tenantEmail) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-bold mb-2">Information Sheet</h3>
        <p className="text-base text-muted">
          Add a tenant email address to send the prescribed information sheet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-bold mb-2">Information Sheet</h3>
      <p className="text-base text-muted mb-4">
        Send the prescribed information (Section 213, Housing Act 2004) to{" "}
        <strong className="text-foreground">{tenantName}</strong> at{" "}
        <strong className="text-foreground">{tenantEmail}</strong>.
      </p>

      {hasSentBefore && status === "idle" && (
        <p className="text-sm text-success font-medium mb-4">
          Previously sent. You can send again if needed.
        </p>
      )}

      {status === "sent" && (
        <div
          className="rounded-lg bg-success/10 border border-success/30 p-4 mb-4"
          role="alert"
        >
          <p className="text-base font-semibold text-success">
            Information sheet sent successfully to {tenantEmail}
          </p>
        </div>
      )}

      {status === "error" && (
        <p className="text-base text-danger mb-4" role="alert">
          {errorMsg}
        </p>
      )}

      <button
        onClick={handleSend}
        disabled={status === "loading"}
        className="h-[48px] rounded-lg bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "loading"
          ? "Sending…"
          : hasSentBefore && status !== "sent"
            ? "Resend Information Sheet"
            : "Send Information Sheet"}
      </button>
    </div>
  );
}
