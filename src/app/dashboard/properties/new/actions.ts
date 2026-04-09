"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AddPropertyState = {
  error?: string;
  propertyId?: string;
  isFirst?: boolean;
};

export async function addProperty(
  _prev: AddPropertyState,
  formData: FormData,
): Promise<AddPropertyState> {
  const address = (formData.get("address") as string)?.trim();
  const tenantName = (formData.get("tenantName") as string)?.trim();
  const tenantEmail = (formData.get("tenantEmail") as string)?.trim();
  const tenancyType = formData.get("tenancyType") as string;

  // Validation
  if (!address) return { error: "Please enter the property address." };
  if (!tenantName) return { error: "Please enter the tenant's name." };
  if (!tenancyType) return { error: "Please select a tenancy type." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Free tier paywall: limit to 1 property
  const { count: propertyCount } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((propertyCount ?? 0) >= 1) {
    redirect("/dashboard/upgrade");
  }

  // Insert property
  const { data: property, error: propError } = await supabase
    .from("properties")
    .insert({
      user_id: user.id,
      name: address,
      address_line_1: address,
      city: "",
      postcode: "",
    })
    .select("id")
    .single();

  if (propError) {
    return { error: "Could not save the property. Please try again." };
  }

  // Insert tenant
  const { error: tenantError } = await supabase.from("tenants").insert({
    user_id: user.id,
    property_id: property.id,
    full_name: tenantName,
    email: tenantEmail || null,
    tenancy_type: tenancyType,
    tenancy_start: new Date().toISOString().split("T")[0],
  });

  if (tenantError) {
    // Clean up the property if tenant insert fails
    await supabase.from("properties").delete().eq("id", property.id);
    return { error: "Could not save the tenant details. Please try again." };
  }

  // Check if this is the user's first property
  const { count } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isFirst = count === 1;

  redirect(`/dashboard?newProperty=${property.id}&first=${isFirst}`);
}
