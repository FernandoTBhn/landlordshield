import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json();
  const { taxYear, quarter, incomeType, totalIncome, totalExpenses, netProfit, transactionCount } = body;

  if (!taxYear || !quarter) {
    return NextResponse.json({ error: "Missing taxYear or quarter" }, { status: 400 });
  }

  // Upsert — update if same user/year/quarter exists, otherwise insert
  const { data: existing } = await supabase
    .from("mtd_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("tax_year", taxYear)
    .eq("quarter", quarter)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("mtd_records")
      .update({
        income_type: incomeType ?? "property",
        total_income: totalIncome ?? 0,
        total_expenses: totalExpenses ?? 0,
        net_profit: netProfit ?? 0,
        transaction_count: transactionCount ?? 0,
        status: "exported",
        exported_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: existing.id, updated: true });
  }

  const { data: record, error: insertErr } = await supabase
    .from("mtd_records")
    .insert({
      user_id: user.id,
      tax_year: taxYear,
      quarter,
      income_type: incomeType ?? "property",
      total_income: totalIncome ?? 0,
      total_expenses: totalExpenses ?? 0,
      net_profit: netProfit ?? 0,
      transaction_count: transactionCount ?? 0,
      status: "exported",
      exported_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertErr || !record) {
    return NextResponse.json({ error: "Failed to save record" }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: record.id, updated: false });
}
