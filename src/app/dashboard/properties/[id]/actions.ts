"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type SaveCertState = {
  error?: string;
  success?: boolean;
};

export async function saveCertificate(
  _prev: SaveCertState,
  formData: FormData,
): Promise<SaveCertState> {
  const propertyId = formData.get("propertyId") as string;
  const certType = formData.get("certType") as string;
  const issuedDate = formData.get("issuedDate") as string;
  const expiryDate = formData.get("expiryDate") as string;

  if (!issuedDate || !expiryDate) {
    return { error: "Please enter both the issued and expiry dates." };
  }

  if (new Date(expiryDate) <= new Date(issuedDate)) {
    return { error: "Expiry date must be after the issued date." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Compute status based on expiry
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  let status: string;
  if (daysUntilExpiry < 0) {
    status = "expired";
  } else if (daysUntilExpiry <= 60) {
    status = "expiring_soon";
  } else {
    status = "valid";
  }

  // Upsert — update if exists, insert if not
  const { data: existing } = await supabase
    .from("certificates")
    .select("id")
    .eq("property_id", propertyId)
    .eq("cert_type", certType)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("certificates")
      .update({ issued_date: issuedDate, expiry_date: expiryDate, status })
      .eq("id", existing.id);

    if (error) return { error: "Could not update the certificate." };
  } else {
    const { error } = await supabase.from("certificates").insert({
      user_id: user.id,
      property_id: propertyId,
      cert_type: certType,
      issued_date: issuedDate,
      expiry_date: expiryDate,
      status,
    });

    if (error) return { error: "Could not save the certificate." };
  }

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { success: true };
}
