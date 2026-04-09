// MTD Property Income transaction categorisation via pattern matching

export const MTD_CATEGORIES = [
  { value: "rental_income", label: "Rental Income" },
  { value: "repairs_maintenance", label: "Repairs & Maintenance" },
  { value: "insurance", label: "Insurance" },
  { value: "management_fees", label: "Management Fees" },
  { value: "legal_professional", label: "Legal / Professional" },
  { value: "utilities", label: "Utilities" },
  { value: "ground_rent_service", label: "Ground Rent / Service Charges" },
  { value: "mortgage_interest", label: "Mortgage Interest" },
  { value: "other_expenses", label: "Other Expenses" },
] as const;

export type MtdCategory = (typeof MTD_CATEGORIES)[number]["value"];

export type Confidence = "high" | "medium" | "low";

export type CategorisedTransaction = {
  index: number;
  date: string;
  description: string;
  amount: number;
  category: MtdCategory;
  confidence: Confidence;
  confirmed: boolean;
};

type Rule = {
  patterns: RegExp[];
  category: MtdCategory;
  confidence: Confidence;
};

// Rules ordered by specificity — first match wins
const RULES: Rule[] = [
  // Rental income
  {
    patterns: [
      /\brent\b/i,
      /\brental\s*(income|payment|receipt)?\b/i,
      /\btenant\s*(payment|transfer)\b/i,
      /\bstanding\s*order\b.*\b(rent|tenant)\b/i,
      /\bhousing\s*benefit\b/i,
      /\buniversal\s*credit\b/i,
      /\blha\b/i,
    ],
    category: "rental_income",
    confidence: "high",
  },
  // Mortgage interest
  {
    patterns: [
      /\bmortgage\b/i,
      /\bloan\s*(interest|repayment|payment)\b/i,
      /\binterest\s*(payment|charge)\b/i,
      /\bnationwide\b/i,
      /\bhalifax\b/i,
      /\bsantander\b.*\b(mort|loan)\b/i,
      /\bbuy[\s-]*to[\s-]*let\b/i,
    ],
    category: "mortgage_interest",
    confidence: "high",
  },
  // Insurance
  {
    patterns: [
      /\binsurance\b/i,
      /\blandlord\s*insurance\b/i,
      /\bbuildings?\s*insurance\b/i,
      /\bcontents?\s*insurance\b/i,
      /\brent\s*guarantee\b/i,
      /\baviva\b/i,
      /\bdirect\s*line\b/i,
      /\baxa\b/i,
    ],
    category: "insurance",
    confidence: "high",
  },
  // Management fees
  {
    patterns: [
      /\bmanagement\s*(fee|charge|cost)\b/i,
      /\bletting\s*agent\b/i,
      /\bagent\s*(fee|commission)\b/i,
      /\bproperty\s*management\b/i,
      /\bfoxtons\b/i,
      /\bcountrywide\b/i,
      /\bopenrent\b/i,
    ],
    category: "management_fees",
    confidence: "high",
  },
  // Legal / Professional
  {
    patterns: [
      /\bsolicitor\b/i,
      /\blegal\s*(fee|cost|service)\b/i,
      /\baccountant\b/i,
      /\baccounting\b/i,
      /\btax\s*(advice|return|service)\b/i,
      /\bsurvey(or)?\b/i,
      /\binventory\s*(check|clerk)\b/i,
      /\breference\s*(check|fee)\b/i,
      /\btenancy\s*agreement\b/i,
      /\beviction\b/i,
    ],
    category: "legal_professional",
    confidence: "high",
  },
  // Ground rent / Service charges
  {
    patterns: [
      /\bground\s*rent\b/i,
      /\bservice\s*charge\b/i,
      /\bleasehold\b/i,
      /\bfreeholder\b/i,
      /\bmanaging\s*agent\b/i,
      /\bmaintenance\s*charge\b/i,
      /\bsinking\s*fund\b/i,
    ],
    category: "ground_rent_service",
    confidence: "high",
  },
  // Utilities
  {
    patterns: [
      /\b(gas|electric|water|sewage|broadband|internet|phone|telecom)\b/i,
      /\butility\b/i,
      /\butilities\b/i,
      /\bcouncil\s*tax\b/i,
      /\bbritish\s*gas\b/i,
      /\bee\s*energy\b/i,
      /\boctopus\b/i,
      /\bbulb\b/i,
      /\bthames\s*water\b/i,
      /\bsevern\s*trent\b/i,
      /\bbt\b.*\b(broadband|line)\b/i,
    ],
    category: "utilities",
    confidence: "high",
  },
  // Repairs & Maintenance — medium confidence (broader patterns)
  {
    patterns: [
      /\brepair\b/i,
      /\bmaintenance\b/i,
      /\bplumb(er|ing)\b/i,
      /\belectrician\b/i,
      /\bdecorat(e|ing|or)\b/i,
      /\bpaint(ing|er)?\b/i,
      /\broof(ing|er)?\b/i,
      /\bboiler\b/i,
      /\bheating\b/i,
      /\block(smith)?\b/i,
      /\bcarpet\b/i,
      /\bfloor(ing)?\b/i,
      /\bcleaning\b/i,
      /\bgarden(er|ing)?\b/i,
      /\bwindow\b/i,
      /\bgutter\b/i,
      /\bdamp\b/i,
      /\bpest\s*control\b/i,
    ],
    category: "repairs_maintenance",
    confidence: "high",
  },
  // Medium confidence: hardware/DIY stores
  {
    patterns: [
      /\bb&q\b/i,
      /\bscrewfix\b/i,
      /\btooling\b/i,
      /\bwickes\b/i,
      /\bhomebase\b/i,
      /\btoolstation\b/i,
    ],
    category: "repairs_maintenance",
    confidence: "medium",
  },
  // Medium confidence: general transfers that might be rent
  {
    patterns: [
      /\btransfer\b/i,
      /\bstanding\s*order\b/i,
      /\bdirect\s*debit\b/i,
    ],
    category: "other_expenses",
    confidence: "medium",
  },
];

/**
 * Categorise a single transaction description.
 */
export function categoriseDescription(description: string): {
  category: MtdCategory;
  confidence: Confidence;
} {
  const desc = description.trim();

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(desc)) {
        return { category: rule.category, confidence: rule.confidence };
      }
    }
  }

  return { category: "other_expenses", confidence: "low" };
}

/**
 * Categorise all transactions.
 */
export function categoriseAll(
  rows: { date: string; description: string; amount: number }[],
): CategorisedTransaction[] {
  return rows.map((row, index) => {
    const { category, confidence } = categoriseDescription(row.description);
    return {
      index,
      date: row.date,
      description: row.description,
      amount: row.amount,
      category,
      confidence,
      confirmed: false,
    };
  });
}

/**
 * Parse an amount string to number.
 */
export function parseAmount(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const cleaned = String(val).replace(/[£$€,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Get category label from value.
 */
export function getCategoryLabel(value: string): string {
  return MTD_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/* ── Health Check ──────────────────────────────────── */

export type HealthCheckItem = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
};

export function runHealthCheck(
  transactions: CategorisedTransaction[],
  quarter: string,
  taxYear: string,
): HealthCheckItem[] {
  const checks: HealthCheckItem[] = [];

  // 1. Temporal completeness — check if transactions span the quarter
  const dates = transactions
    .map((t) => new Date(t.date))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length >= 2) {
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const spanDays = Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

    if (spanDays >= 75) {
      checks.push({
        id: "temporal",
        label: "Temporal completeness",
        status: "pass",
        detail: `Transactions span ${spanDays} days (${formatShortDate(firstDate)} – ${formatShortDate(lastDate)}).`,
      });
    } else if (spanDays >= 30) {
      checks.push({
        id: "temporal",
        label: "Temporal completeness",
        status: "warn",
        detail: `Transactions only span ${spanDays} days. A full quarter is ~90 days. You may be missing data.`,
      });
    } else {
      checks.push({
        id: "temporal",
        label: "Temporal completeness",
        status: "fail",
        detail: `Transactions only span ${spanDays} days — this doesn't look like a full quarter. Check your date range.`,
      });
    }
  } else {
    checks.push({
      id: "temporal",
      label: "Temporal completeness",
      status: "fail",
      detail: "Not enough dated transactions to verify quarter coverage.",
    });
  }

  // 2. Duplicates — same date + same amount + same description
  const seen = new Map<string, number>();
  let dupeCount = 0;
  for (const t of transactions) {
    const key = `${t.date}|${t.amount}|${t.description.toLowerCase().trim()}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  for (const count of seen.values()) {
    if (count > 1) dupeCount += count - 1;
  }

  if (dupeCount === 0) {
    checks.push({
      id: "duplicates",
      label: "Duplicate detection",
      status: "pass",
      detail: "No duplicate transactions found.",
    });
  } else {
    checks.push({
      id: "duplicates",
      label: "Duplicate detection",
      status: "warn",
      detail: `${dupeCount} potential duplicate${dupeCount > 1 ? "s" : ""} found (same date, amount and description).`,
    });
  }

  // 3. Value anomalies — amounts more than 3 standard deviations from mean
  const amounts = transactions.map((t) => Math.abs(t.amount)).filter((a) => a > 0);
  let anomalyCount = 0;
  if (amounts.length > 5) {
    const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    const variance = amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + 3 * stdDev;

    for (const t of transactions) {
      if (Math.abs(t.amount) > threshold) anomalyCount++;
    }
  }

  if (anomalyCount === 0) {
    checks.push({
      id: "anomalies",
      label: "Value anomalies",
      status: "pass",
      detail: "No unusual amounts detected.",
    });
  } else {
    checks.push({
      id: "anomalies",
      label: "Value anomalies",
      status: "warn",
      detail: `${anomalyCount} transaction${anomalyCount > 1 ? "s" : ""} with unusually large amounts. Review these for accuracy.`,
    });
  }

  // 4. Empty categories — any category with 0 transactions
  const categoryCounts = new Map<string, number>();
  for (const t of transactions) {
    categoryCounts.set(t.category, (categoryCounts.get(t.category) ?? 0) + 1);
  }
  const hasRentalIncome = (categoryCounts.get("rental_income") ?? 0) > 0;

  if (hasRentalIncome) {
    checks.push({
      id: "categories",
      label: "Category coverage",
      status: "pass",
      detail: `Rental income detected. ${categoryCounts.size} categories in use.`,
    });
  } else {
    checks.push({
      id: "categories",
      label: "Category coverage",
      status: "warn",
      detail: "No transactions categorised as Rental Income. Check your data or adjust categories.",
    });
  }

  // 5. Logical balance — income should be positive for property
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  if (totalIncome > 0 && totalIncome >= totalExpenses * 0.2) {
    checks.push({
      id: "balance",
      label: "Logical balance",
      status: "pass",
      detail: `Income £${totalIncome.toFixed(2)} vs expenses £${totalExpenses.toFixed(2)} — looks reasonable.`,
    });
  } else if (totalIncome > 0) {
    checks.push({
      id: "balance",
      label: "Logical balance",
      status: "warn",
      detail: `Expenses (£${totalExpenses.toFixed(2)}) are much higher than income (£${totalIncome.toFixed(2)}). This may be correct for a renovation period.`,
    });
  } else {
    checks.push({
      id: "balance",
      label: "Logical balance",
      status: "fail",
      detail: "No positive income transactions found. Are you sure this file contains income data?",
    });
  }

  return checks;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
