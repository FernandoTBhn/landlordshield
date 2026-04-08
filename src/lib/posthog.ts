import posthog from "posthog-js";

export function trackFirstPropertyAdded(propertyId: string) {
  if (typeof window !== "undefined") {
    posthog.capture("first_property_added", { property_id: propertyId });
  }
}

export function trackActivationMilestone(propertyId: string, tenantId: string) {
  if (typeof window !== "undefined") {
    posthog.capture("activation_milestone", {
      property_id: propertyId,
      tenant_id: tenantId,
      trigger: "first_information_sheet_sent",
    });
  }
}
