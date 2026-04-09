import * as XLSX from "xlsx";

export type RawRow = Record<string, string | number | null>;

export type ParsedSheet = {
  headers: string[];
  rows: RawRow[];
  sheetName: string;
};

export type ColumnGuess = {
  date: string | null;
  description: string | null;
  amount: string | null;
};

/**
 * Parse an uploaded file (xlsx or csv) and return headers + rows.
 */
export function parseSpreadsheet(buffer: ArrayBuffer, filename: string): ParsedSheet {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const jsonRows = XLSX.utils.sheet_to_json<RawRow>(sheet, {
    defval: null,
    raw: false,
  });

  const headers =
    jsonRows.length > 0 ? Object.keys(jsonRows[0]) : [];

  return { headers, rows: jsonRows, sheetName };
}

/**
 * Auto-detect which columns are likely date, description, amount.
 */
export function guessColumns(headers: string[], rows: RawRow[]): ColumnGuess {
  const lower = headers.map((h) => h.toLowerCase().trim());

  // Date detection
  const dateKeywords = ["date", "transaction date", "txn date", "payment date", "posted"];
  let dateCol: string | null = null;
  for (const kw of dateKeywords) {
    const idx = lower.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      dateCol = headers[idx];
      break;
    }
  }
  // Fallback: find column where most values look like dates
  if (!dateCol) {
    dateCol = findColumnByPattern(headers, rows, isDateLike);
  }

  // Description detection
  const descKeywords = ["description", "details", "reference", "memo", "narrative", "payee", "particulars"];
  let descCol: string | null = null;
  for (const kw of descKeywords) {
    const idx = lower.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      descCol = headers[idx];
      break;
    }
  }

  // Amount detection
  const amountKeywords = ["amount", "total", "value", "debit", "credit", "sum", "net", "gross"];
  let amountCol: string | null = null;
  for (const kw of amountKeywords) {
    const idx = lower.findIndex((h) => h.includes(kw));
    if (idx !== -1) {
      amountCol = headers[idx];
      break;
    }
  }
  // Fallback: find numeric column
  if (!amountCol) {
    amountCol = findColumnByPattern(
      headers.filter((h) => h !== dateCol && h !== descCol),
      rows,
      isNumericLike,
    );
  }

  return { date: dateCol, description: descCol, amount: amountCol };
}

function findColumnByPattern(
  headers: string[],
  rows: RawRow[],
  test: (val: string) => boolean,
): string | null {
  const sample = rows.slice(0, 20);
  let bestCol: string | null = null;
  let bestScore = 0;

  for (const header of headers) {
    let matches = 0;
    for (const row of sample) {
      const val = String(row[header] ?? "").trim();
      if (val && test(val)) matches++;
    }
    const score = sample.length > 0 ? matches / sample.length : 0;
    if (score > bestScore && score > 0.4) {
      bestScore = score;
      bestCol = header;
    }
  }

  return bestCol;
}

function isDateLike(val: string): boolean {
  // Common date patterns: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD Mon YYYY
  return /^\d{1,4}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(val) ||
    /^\d{1,2}\s+\w{3}\s+\d{4}$/.test(val) ||
    !isNaN(Date.parse(val));
}

function isNumericLike(val: string): boolean {
  // Strip currency symbols and commas
  const cleaned = val.replace(/[£$€,\s]/g, "");
  return /^-?\d+(\.\d+)?$/.test(cleaned);
}
