"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  parseSpreadsheet,
  guessColumns,
  type ParsedSheet,
  type ColumnGuess,
} from "@/lib/spreadsheet";
import {
  categoriseAll,
  parseAmount,
  getCategoryLabel,
  MTD_CATEGORIES,
  runHealthCheck,
  type CategorisedTransaction,
  type MtdCategory,
  type HealthCheckItem,
} from "@/lib/categorise";

/* ── Constants ─────────────────────────────────────── */

const STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Map columns" },
  { num: 3, label: "Review" },
  { num: 4, label: "Categorise" },
  { num: 5, label: "Summary" },
] as const;

const INCOME_TYPES = [
  { value: "property", label: "Property Income" },
  { value: "self_employment", label: "Self-Employment" },
] as const;

const TAX_YEARS = [
  { value: "2025-26", label: "2025–26 (6 Apr 2025 – 5 Apr 2026)" },
  { value: "2026-27", label: "2026–27 (6 Apr 2026 – 5 Apr 2027)" },
] as const;

const QUARTERS = [
  { value: "Q1", label: "Q1 (6 Apr – 5 Jul)" },
  { value: "Q2", label: "Q2 (6 Jul – 5 Oct)" },
  { value: "Q3", label: "Q3 (6 Oct – 5 Jan)" },
  { value: "Q4", label: "Q4 (6 Jan – 5 Apr)" },
] as const;

const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
];

/* ── Types ─────────────────────────────────────────── */

type MappingConfig = {
  dateCol: string;
  descriptionCol: string;
  amountCol: string;
  incomeType: string;
  taxYear: string;
  quarter: string;
};

/* ── Main Component ────────────────────────────────── */

export default function MtdPage() {
  const [step, setStep] = useState(1);

  // Step 1: Upload state
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [guess, setGuess] = useState<ColumnGuess | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Step 2: Mapping state
  const [mapping, setMapping] = useState<MappingConfig>({
    dateCol: "",
    descriptionCol: "",
    amountCol: "",
    incomeType: "property",
    taxYear: "2025-26",
    quarter: "Q1",
  });
  const [mappingError, setMappingError] = useState<string | null>(null);

  // Step 4: Categorised transactions
  const [categorised, setCategorised] = useState<CategorisedTransaction[]>([]);

  // File handling
  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);

    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !file.name.endsWith(".csv") &&
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      setUploadError("Please upload a .xlsx or .csv file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 10 MB.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseSpreadsheet(buffer, file.name);

      if (parsed.rows.length === 0) {
        setUploadError("The file appears to be empty. Please check and try again.");
        return;
      }

      const guessed = guessColumns(parsed.headers, parsed.rows);

      setSheet(parsed);
      setGuess(guessed);
      setFileName(file.name);

      // Pre-fill mapping from guesses
      setMapping((prev) => ({
        ...prev,
        dateCol: guessed.date ?? "",
        descriptionCol: guessed.description ?? "",
        amountCol: guessed.amount ?? "",
      }));

      setStep(2);
    } catch {
      setUploadError("Could not read the file. Please check it is a valid spreadsheet.");
    }
  }, []);

  // Step 2 validation
  const handleMappingNext = () => {
    setMappingError(null);

    if (!mapping.dateCol) {
      setMappingError("Please select which column contains the date.");
      return;
    }
    if (!mapping.descriptionCol) {
      setMappingError("Please select which column contains the description.");
      return;
    }
    if (!mapping.amountCol) {
      setMappingError("Please select which column contains the amount.");
      return;
    }

    // Check for duplicate column selections
    const cols = [mapping.dateCol, mapping.descriptionCol, mapping.amountCol];
    if (new Set(cols).size !== cols.length) {
      setMappingError("Each column must be different. Please check your selections.");
      return;
    }

    setStep(3);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-base font-medium text-primary hover:underline mb-8"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Dashboard
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold mb-2">
        MTD Tax Prep
      </h1>
      <p className="text-base text-muted mb-8">
        Upload your income and expenses spreadsheet to prepare your Making Tax
        Digital quarterly submission.
      </p>

      {/* Progress bar */}
      <ProgressBar currentStep={step} />

      {/* Step content */}
      <div className="mt-8">
        {step === 1 && (
          <StepUpload
            onFile={handleFile}
            error={uploadError}
          />
        )}

        {step === 2 && sheet && (
          <StepMapping
            sheet={sheet}
            guess={guess}
            mapping={mapping}
            setMapping={setMapping}
            error={mappingError}
            onNext={handleMappingNext}
            onBack={() => setStep(1)}
            fileName={fileName}
          />
        )}

        {step === 3 && sheet && (
          <StepReview
            sheet={sheet}
            mapping={mapping}
            onBack={() => setStep(2)}
            onNext={() => {
              // Run categorisation when moving to step 4
              const rows = sheet.rows.map((row) => ({
                date: String(row[mapping.dateCol] ?? ""),
                description: String(row[mapping.descriptionCol] ?? ""),
                amount: parseAmount(row[mapping.amountCol]),
              }));
              setCategorised(categoriseAll(rows));
              setStep(4);
            }}
          />
        )}

        {step === 4 && categorised.length > 0 && (
          <StepCategorise
            transactions={categorised}
            setTransactions={setCategorised}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}

        {step === 5 && (
          <StepSummary
            transactions={categorised}
            mapping={mapping}
            onBack={() => setStep(4)}
          />
        )}
      </div>
    </div>
  );
}

/* ── Progress Bar ──────────────────────────────────── */

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Progress">
      {/* Mobile: simple text */}
      <p className="sm:hidden text-base font-semibold text-primary mb-2">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}
      </p>

      {/* Desktop: full bar */}
      <div className="hidden sm:flex items-center gap-1">
        {STEPS.map((s, i) => {
          const isActive = s.num === currentStep;
          const isCompleted = s.num < currentStep;

          return (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    isCompleted
                      ? "bg-success text-success-foreground"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-border text-muted"
                  }`}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </span>
                <span
                  className={`text-sm font-medium truncate ${
                    isActive ? "text-primary font-bold" : isCompleted ? "text-success" : "text-muted"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 rounded ${
                    isCompleted ? "bg-success" : "bg-border"
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress percentage bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
        />
      </div>
    </nav>
  );
}

/* ── Step 1: Upload ────────────────────────────────── */

function StepUpload({
  onFile,
  error,
}: {
  onFile: (file: File) => void;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Step 1: Upload your spreadsheet
      </h2>
      <p className="text-base text-muted mb-6">
        Upload the spreadsheet containing your rental income and expenses. We
        accept <strong>.xlsx</strong> and <strong>.csv</strong> files up to 10 MB.
      </p>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Upload spreadsheet file"
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 sm:p-16 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-card"
        }`}
      >
        {/* Upload icon */}
        <svg
          className="mx-auto mb-4 text-muted"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>

        <p className="text-lg font-semibold mb-1">
          {isDragging ? "Drop your file here" : "Drag and drop your file here"}
        </p>
        <p className="text-base text-muted mb-4">or</p>
        <span className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground">
          Browse files
        </span>
        <p className="text-sm text-muted mt-4">
          Accepted: .xlsx, .csv — Max 10 MB
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {error && (
        <p className="mt-4 text-base text-danger font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Step 2: Map Columns ───────────────────────────── */

function StepMapping({
  sheet,
  guess,
  mapping,
  setMapping,
  error,
  onNext,
  onBack,
  fileName,
}: {
  sheet: ParsedSheet;
  guess: ColumnGuess | null;
  mapping: MappingConfig;
  setMapping: React.Dispatch<React.SetStateAction<MappingConfig>>;
  error: string | null;
  onNext: () => void;
  onBack: () => void;
  fileName: string | null;
}) {
  const previewRows = sheet.rows.slice(0, 10);

  const guessedCount = [guess?.date, guess?.description, guess?.amount].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Step 2: Map your columns
      </h2>
      <p className="text-base text-muted mb-2">
        We found <strong className="text-foreground">{sheet.rows.length} rows</strong> in{" "}
        <strong className="text-foreground">{fileName}</strong>.
        {guessedCount > 0 && (
          <> We auto-detected {guessedCount} column{guessedCount > 1 ? "s" : ""} — please confirm or adjust.</>
        )}
      </p>

      {/* Preview table */}
      <div className="my-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background">
              {sheet.headers.map((h) => (
                <th key={h} className="px-3 py-2 text-left font-bold text-foreground whitespace-nowrap border-b border-border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-background"}>
                {sheet.headers.map((h) => (
                  <td key={h} className="px-3 py-2 whitespace-nowrap text-muted border-b border-border/50">
                    {String(row[h] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sheet.rows.length > 10 && (
        <p className="text-sm text-muted mb-6">
          Showing first 10 of {sheet.rows.length} rows.
        </p>
      )}

      {/* Column mapping selects */}
      <div className="grid gap-5 sm:grid-cols-3 mb-8">
        <ColumnSelect
          label="Date column"
          value={mapping.dateCol}
          onChange={(v) => setMapping((p) => ({ ...p, dateCol: v }))}
          options={sheet.headers}
          guessed={guess?.date ?? null}
        />
        <ColumnSelect
          label="Description column"
          value={mapping.descriptionCol}
          onChange={(v) => setMapping((p) => ({ ...p, descriptionCol: v }))}
          options={sheet.headers}
          guessed={guess?.description ?? null}
        />
        <ColumnSelect
          label="Amount column"
          value={mapping.amountCol}
          onChange={(v) => setMapping((p) => ({ ...p, amountCol: v }))}
          options={sheet.headers}
          guessed={guess?.amount ?? null}
        />
      </div>

      {/* Income type, Tax year, Quarter */}
      <div className="grid gap-5 sm:grid-cols-3 mb-8">
        <div>
          <label htmlFor="incomeType" className="block text-base font-medium mb-2">
            Income type
          </label>
          <select
            id="incomeType"
            value={mapping.incomeType}
            onChange={(e) => setMapping((p) => ({ ...p, incomeType: e.target.value }))}
            className="w-full h-[48px] rounded-lg border border-border bg-card px-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {INCOME_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="taxYear" className="block text-base font-medium mb-2">
            Tax year
          </label>
          <select
            id="taxYear"
            value={mapping.taxYear}
            onChange={(e) => setMapping((p) => ({ ...p, taxYear: e.target.value }))}
            className="w-full h-[48px] rounded-lg border border-border bg-card px-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {TAX_YEARS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quarter" className="block text-base font-medium mb-2">
            Quarter
          </label>
          <select
            id="quarter"
            value={mapping.quarter}
            onChange={(e) => setMapping((p) => ({ ...p, quarter: e.target.value }))}
            className="w-full h-[48px] rounded-lg border border-border bg-card px-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {QUARTERS.map((q) => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-base text-danger font-medium" role="alert">
          {error}
        </p>
      )}

      {/* Navigation buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="h-[48px] rounded-lg border-2 border-primary px-8 text-base font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="h-[48px] rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );
}

function ColumnSelect({
  label,
  value,
  onChange,
  options,
  guessed,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  guessed: string | null;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <label htmlFor={id} className="block text-base font-medium mb-2">
        {label}
        {guessed && value === guessed && (
          <span className="ml-2 text-sm text-success font-normal">(auto-detected)</span>
        )}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[48px] rounded-lg border border-border bg-card px-4 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">— Select column —</option>
        {options.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Step 3: Review ────────────────────────────────── */

function StepReview({
  sheet,
  mapping,
  onBack,
  onNext,
}: {
  sheet: ParsedSheet;
  mapping: MappingConfig;
  onBack: () => void;
  onNext: () => void;
}) {
  const previewRows = sheet.rows.slice(0, 10);

  const incomeLabel = INCOME_TYPES.find((t) => t.value === mapping.incomeType)?.label ?? mapping.incomeType;
  const taxYearLabel = TAX_YEARS.find((t) => t.value === mapping.taxYear)?.label ?? mapping.taxYear;
  const quarterLabel = QUARTERS.find((q) => q.value === mapping.quarter)?.label ?? mapping.quarter;

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Step 3: Review your data
      </h2>
      <p className="text-base text-muted mb-6">
        Check that the mapped columns look correct before continuing.
      </p>

      {/* Config summary */}
      <div className="grid gap-3 sm:grid-cols-3 mb-6 p-4 rounded-lg bg-background border border-border">
        <div>
          <p className="text-sm text-muted">Income type</p>
          <p className="font-semibold">{incomeLabel}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Tax year</p>
          <p className="font-semibold">{taxYearLabel}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Quarter</p>
          <p className="font-semibold">{quarterLabel}</p>
        </div>
      </div>

      {/* Mapped data preview */}
      <div className="overflow-x-auto rounded-lg border border-border mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background">
              <th className="px-4 py-2.5 text-left font-bold border-b border-border">Date</th>
              <th className="px-4 py-2.5 text-left font-bold border-b border-border">Description</th>
              <th className="px-4 py-2.5 text-right font-bold border-b border-border">Amount</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-background"}>
                <td className="px-4 py-2.5 whitespace-nowrap border-b border-border/50">
                  {String(row[mapping.dateCol] ?? "—")}
                </td>
                <td className="px-4 py-2.5 border-b border-border/50">
                  {String(row[mapping.descriptionCol] ?? "—")}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap border-b border-border/50 font-mono">
                  {formatAmount(row[mapping.amountCol])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted mb-6">
        Showing first 10 of {sheet.rows.length} rows. Total rows: <strong>{sheet.rows.length}</strong>.
      </p>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
        <button type="button" onClick={onBack} className="h-[48px] rounded-lg border-2 border-primary px-8 text-base font-semibold text-primary transition-colors hover:bg-primary/5">
          Back
        </button>
        <button type="button" onClick={onNext} className="h-[48px] rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Continue to Categorise
        </button>
      </div>
    </div>
  );
}

/* ── Step 4: Categorise ────────────────────────────── */

const CONFIDENCE_CONFIG = {
  high: { dot: "bg-success", text: "text-success", label: "High", bg: "bg-success/10" },
  medium: { dot: "bg-warning", text: "text-warning", label: "Medium", bg: "bg-warning/10" },
  low: { dot: "bg-danger", text: "text-danger", label: "Low", bg: "bg-danger/10" },
} as const;

function StepCategorise({
  transactions,
  setTransactions,
  onBack,
  onNext,
}: {
  transactions: CategorisedTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<CategorisedTransaction[]>>;
  onBack: () => void;
  onNext: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const highCount = transactions.filter((t) => t.confidence === "high").length;
  const mediumCount = transactions.filter((t) => t.confidence === "medium").length;
  const lowCount = transactions.filter((t) => t.confidence === "low").length;
  const confirmedCount = transactions.filter((t) => t.confirmed).length;

  const filtered = filter === "all"
    ? transactions
    : transactions.filter((t) => t.confidence === filter);

  const confirmAllHigh = () => {
    setTransactions((prev) =>
      prev.map((t) => (t.confidence === "high" ? { ...t, confirmed: true } : t)),
    );
  };

  const updateCategory = (index: number, category: MtdCategory) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.index === index ? { ...t, category, confirmed: true } : t,
      ),
    );
  };

  const toggleConfirm = (index: number) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.index === index ? { ...t, confirmed: !t.confirmed } : t,
      ),
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Step 4: Categorise transactions
      </h2>
      <p className="text-base text-muted mb-4">
        We auto-categorised your transactions. Review and confirm the results.
        Green items are high confidence — you can confirm them all at once.
      </p>

      {/* Confidence summary */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-6">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-lg border p-3 text-center transition-colors ${filter === "all" ? "border-primary bg-primary/5" : "border-border"}`}
        >
          <p className="text-xl font-bold">{transactions.length}</p>
          <p className="text-sm text-muted">All</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter("high")}
          className={`rounded-lg border p-3 text-center transition-colors ${filter === "high" ? "border-success bg-success/5" : "border-border"}`}
        >
          <p className="text-xl font-bold text-success">{highCount}</p>
          <p className="text-sm text-muted">High</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter("medium")}
          className={`rounded-lg border p-3 text-center transition-colors ${filter === "medium" ? "border-warning bg-warning/5" : "border-border"}`}
        >
          <p className="text-xl font-bold text-warning">{mediumCount}</p>
          <p className="text-sm text-muted">Medium</p>
        </button>
        <button
          type="button"
          onClick={() => setFilter("low")}
          className={`rounded-lg border p-3 text-center transition-colors ${filter === "low" ? "border-danger bg-danger/5" : "border-border"}`}
        >
          <p className="text-xl font-bold text-danger">{lowCount}</p>
          <p className="text-sm text-muted">Low</p>
        </button>
      </div>

      {/* Batch confirm high */}
      {highCount > 0 && confirmedCount < transactions.length && (
        <button
          type="button"
          onClick={confirmAllHigh}
          className="mb-6 h-[48px] w-full rounded-lg bg-success px-6 text-base font-semibold text-success-foreground transition-colors hover:bg-success/90"
        >
          Confirm all {highCount} high-confidence transactions
        </button>
      )}

      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${transactions.length > 0 ? (confirmedCount / transactions.length) * 100 : 0}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-muted whitespace-nowrap">
          {confirmedCount}/{transactions.length} confirmed
        </span>
      </div>

      {/* Transaction list */}
      <div className="flex flex-col gap-3 mb-6 max-h-[500px] overflow-y-auto">
        {filtered.map((t) => {
          const conf = CONFIDENCE_CONFIG[t.confidence];
          return (
            <div
              key={t.index}
              className={`rounded-lg border p-4 transition-colors ${
                t.confirmed ? "border-success/30 bg-success/[0.03]" : "border-border"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Confidence dot + description */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className={`shrink-0 h-3 w-3 rounded-full ${conf.dot}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium truncate">{t.description || "No description"}</p>
                    <p className="text-sm text-muted">{t.date} &middot; {formatAmount(t.amount)}</p>
                  </div>
                </div>

                {/* Category select */}
                <select
                  value={t.category}
                  onChange={(e) => updateCategory(t.index, e.target.value as MtdCategory)}
                  aria-label={`Category for ${t.description}`}
                  className="h-[40px] rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-56"
                >
                  {MTD_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                {/* Confidence badge */}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${conf.bg} ${conf.text} shrink-0`}>
                  {conf.label}
                </span>

                {/* Confirm toggle */}
                <button
                  type="button"
                  onClick={() => toggleConfirm(t.index)}
                  aria-label={t.confirmed ? "Unconfirm" : "Confirm"}
                  className={`shrink-0 h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                    t.confirmed
                      ? "bg-success text-success-foreground"
                      : "border border-border text-muted hover:border-success hover:text-success"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
        <button type="button" onClick={onBack} className="h-[48px] rounded-lg border-2 border-primary px-8 text-base font-semibold text-primary transition-colors hover:bg-primary/5">
          Back
        </button>
        <button type="button" onClick={onNext} className="h-[48px] rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Continue to Summary
        </button>
      </div>
    </div>
  );
}

/* ── Step 5: Summary ───────────────────────────────── */

function StepSummary({
  transactions,
  mapping,
  onBack,
}: {
  transactions: CategorisedTransaction[];
  mapping: MappingConfig;
  onBack: () => void;
}) {
  const incomeLabel = INCOME_TYPES.find((t) => t.value === mapping.incomeType)?.label ?? mapping.incomeType;
  const taxYearLabel = TAX_YEARS.find((t) => t.value === mapping.taxYear)?.label ?? mapping.taxYear;
  const quarterLabel = QUARTERS.find((q) => q.value === mapping.quarter)?.label ?? mapping.quarter;

  // Totals
  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const t of transactions) {
    if (t.amount >= 0) {
      totalIncome += t.amount;
      incomeCount++;
    } else {
      totalExpenses += Math.abs(t.amount);
      expenseCount++;
    }
  }
  const netProfit = totalIncome - totalExpenses;

  // Category breakdown
  const byCategory = new Map<string, { count: number; total: number }>();
  for (const t of transactions) {
    const entry = byCategory.get(t.category) ?? { count: 0, total: 0 };
    entry.count++;
    entry.total += t.amount;
    byCategory.set(t.category, entry);
  }

  // Health check
  const healthChecks = runHealthCheck(transactions, mapping.quarter, mapping.taxYear);
  const passCount = healthChecks.filter((c) => c.status === "pass").length;
  const overallHealth = passCount === healthChecks.length ? "pass" : healthChecks.some((c) => c.status === "fail") ? "fail" : "warn";
  const healthColour = { pass: "text-success", warn: "text-warning", fail: "text-danger" }[overallHealth];
  const healthLabel = { pass: "All clear", warn: "Needs review", fail: "Issues found" }[overallHealth];

  const [exportSaved, setExportSaved] = useState(false);

  // Export CSV + save record to Supabase
  const exportCsv = async () => {
    const header = "Date,Description,Amount,Category,Confidence,Confirmed\n";
    const rows = transactions.map((t) =>
      [
        `"${t.date}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount.toFixed(2),
        `"${getCategoryLabel(t.category)}"`,
        t.confidence,
        t.confirmed ? "Yes" : "No",
      ].join(","),
    );
    const csv = header + rows.join("\n");
    downloadFile(csv, `mtd-${mapping.taxYear}-${mapping.quarter}.csv`, "text/csv");

    // Save MTD record to Supabase
    try {
      await fetch("/api/mtd/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxYear: mapping.taxYear,
          quarter: mapping.quarter,
          incomeType: mapping.incomeType,
          totalIncome,
          totalExpenses,
          netProfit,
          transactionCount: transactions.length,
        }),
      });
      setExportSaved(true);
    } catch {
      // CSV still downloaded, just record didn't save
    }
  };

  // Export health check
  const exportHealthCheck = () => {
    const lines = [
      `MTD Health Check — ${quarterLabel} ${taxYearLabel}`,
      `Generated: ${new Date().toLocaleDateString("en-GB")}`,
      `Overall: ${healthLabel}`,
      "",
      ...healthChecks.map((c) => {
        const icon = c.status === "pass" ? "PASS" : c.status === "warn" ? "WARN" : "FAIL";
        return `[${icon}] ${c.label}\n      ${c.detail}`;
      }),
      "",
      `Summary:`,
      `  Total Income: £${totalIncome.toFixed(2)} (${incomeCount} transactions)`,
      `  Total Expenses: £${totalExpenses.toFixed(2)} (${expenseCount} transactions)`,
      `  Net Profit: £${netProfit.toFixed(2)}`,
      `  Income Type: ${incomeLabel}`,
      "",
      "Category Breakdown:",
      ...[...byCategory.entries()].map(
        ([cat, { count, total }]) => `  ${getCategoryLabel(cat)}: ${count} txns, £${total.toFixed(2)}`,
      ),
    ];
    downloadFile(lines.join("\n"), `health-check-${mapping.taxYear}-${mapping.quarter}.txt`, "text/plain");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Step 5: Quarterly Summary
      </h2>
      <p className="text-base text-muted mb-6">
        Here&rsquo;s your overview for {quarterLabel} of {taxYearLabel}.
      </p>

      {/* Financial summary cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <SummaryCard label="Total Income" value={`£${totalIncome.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} sub={`${incomeCount} transactions`} colour="success" />
        <SummaryCard label="Total Expenses" value={`£${totalExpenses.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} sub={`${expenseCount} transactions`} colour="danger" />
        <SummaryCard label="Net Profit" value={`£${netProfit.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`} sub={incomeLabel} colour={netProfit >= 0 ? "primary" : "danger"} />
      </div>

      {/* Category breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-3">Category Breakdown</h3>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background">
                <th className="px-4 py-2.5 text-left font-bold border-b border-border">Category</th>
                <th className="px-4 py-2.5 text-right font-bold border-b border-border">Transactions</th>
                <th className="px-4 py-2.5 text-right font-bold border-b border-border">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...byCategory.entries()]
                .sort((a, b) => Math.abs(b[1].total) - Math.abs(a[1].total))
                .map(([cat, { count, total }], i) => (
                  <tr key={cat} className={i % 2 === 0 ? "bg-card" : "bg-background"}>
                    <td className="px-4 py-2.5 border-b border-border/50 font-medium">{getCategoryLabel(cat)}</td>
                    <td className="px-4 py-2.5 border-b border-border/50 text-right text-muted">{count}</td>
                    <td className="px-4 py-2.5 border-b border-border/50 text-right font-mono">{formatAmount(total)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Health Check */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-bold">Health Check</h3>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${
            overallHealth === "pass" ? "bg-success/10 text-success" :
            overallHealth === "warn" ? "bg-warning/10 text-warning" :
            "bg-danger/10 text-danger"
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full ${
              overallHealth === "pass" ? "bg-success" :
              overallHealth === "warn" ? "bg-warning" :
              "bg-danger"
            }`} aria-hidden="true" />
            {healthLabel} ({passCount}/{healthChecks.length})
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {healthChecks.map((check) => (
            <HealthCheckRow key={check.id} check={check} />
          ))}
        </div>
      </div>

      {/* Config summary */}
      <div className="grid gap-3 sm:grid-cols-3 mb-8 p-4 rounded-lg bg-background border border-border">
        <div>
          <p className="text-sm text-muted">Income type</p>
          <p className="font-semibold">{incomeLabel}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Tax year</p>
          <p className="font-semibold">{taxYearLabel}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Quarter</p>
          <p className="font-semibold">{quarterLabel}</p>
        </div>
      </div>

      {/* Export buttons */}
      <div className="grid gap-3 sm:grid-cols-2 mb-8">
        <button
          type="button"
          onClick={exportCsv}
          className="h-[48px] rounded-lg border-2 border-primary px-6 text-base font-semibold text-primary transition-colors hover:bg-primary/5 flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
        <button
          type="button"
          onClick={exportHealthCheck}
          className="h-[48px] rounded-lg border-2 border-primary px-6 text-base font-semibold text-primary transition-colors hover:bg-primary/5 flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Download Health Check
        </button>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
        <button type="button" onClick={onBack} className="h-[48px] rounded-lg border-2 border-primary px-8 text-base font-semibold text-primary transition-colors hover:bg-primary/5">
          Back
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-[48px] items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function HealthCheckRow({ check }: { check: HealthCheckItem }) {
  const config = {
    pass: { dot: "bg-success", bg: "bg-success/10 border-success/30", text: "text-success", icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01 9 11.01" },
    warn: { dot: "bg-warning", bg: "bg-warning/10 border-warning/30", text: "text-warning", icon: "" },
    fail: { dot: "bg-danger", bg: "bg-danger/10 border-danger/30", text: "text-danger", icon: "" },
  }[check.status];

  return (
    <div className={`rounded-lg border p-4 ${config.bg}`}>
      <div className="flex items-start gap-3">
        <span className={`shrink-0 mt-0.5 h-3.5 w-3.5 rounded-full ${config.dot}`} aria-hidden="true" />
        <div>
          <p className={`font-bold ${config.text}`}>{check.label}</p>
          <p className="text-sm text-muted mt-0.5">{check.detail}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  colour,
}: {
  label: string;
  value: string;
  sub: string;
  colour: "success" | "danger" | "primary";
}) {
  const colourMap = {
    success: "text-success",
    danger: "text-danger",
    primary: "text-primary",
  };

  return (
    <div className="rounded-lg border border-border bg-background p-5">
      <p className="text-sm text-muted mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colourMap[colour]}`}>{value}</p>
      <p className="text-sm text-muted mt-1">{sub}</p>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────── */

function formatAmount(val: string | number | null | undefined): string {
  if (val == null) return "—";
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[£$€,\s]/g, ""));
  if (isNaN(num)) return String(val);
  return `£${num.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
