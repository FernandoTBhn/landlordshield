"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackFirstPropertyAdded } from "@/lib/posthog";

export default function PostHogTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const newProperty = searchParams.get("newProperty");
    const isFirst = searchParams.get("first");

    if (newProperty && isFirst === "true") {
      trackFirstPropertyAdded(newProperty);
    }
  }, [searchParams]);

  return null;
}
