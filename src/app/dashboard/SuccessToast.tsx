"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const MESSAGES: Record<string, { text: string; cta?: { label: string; href: string } }> = {
  property: {
    text: "Property added successfully!",
    cta: { label: "Now add your certificates", href: "" }, // href set dynamically
  },
  certificate: {
    text: "Certificate saved successfully.",
  },
  infosheet: {
    text: "Information Sheet sent to your tenant.",
  },
};

export default function SuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<(typeof MESSAGES)[string] | null>(null);
  const [propertyHref, setPropertyHref] = useState<string | null>(null);

  useEffect(() => {
    const type = searchParams.get("success");
    if (type && MESSAGES[type]) {
      const msg = MESSAGES[type];
      setMessage(msg);
      setVisible(true);

      // For property success, link to the new property
      const newPropertyId = searchParams.get("newProperty");
      if (type === "property" && newPropertyId) {
        setPropertyHref(`/dashboard/properties/${newPropertyId}`);
      }

      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      url.searchParams.delete("newProperty");
      url.searchParams.delete("first");
      router.replace(url.pathname, { scroll: false });

      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  if (!visible || !message) return null;

  return (
    <div
      className="mb-6 rounded-xl border border-success/30 bg-success/10 p-4 flex items-center gap-3"
      role="status"
    >
      <svg className="shrink-0 text-success" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <p className="flex-1 text-base font-semibold text-success">
        {message.text}
      </p>
      {message.cta && propertyHref && (
        <Link
          href={propertyHref}
          className="shrink-0 inline-flex h-[40px] items-center justify-center rounded-lg bg-success px-4 text-sm font-semibold text-success-foreground transition-colors hover:bg-success/90"
        >
          {message.cta.label}
        </Link>
      )}
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="shrink-0 p-1 text-success hover:text-success/70 transition-colors"
        aria-label="Dismiss"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
