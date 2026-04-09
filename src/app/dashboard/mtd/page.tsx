"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  parseSpreadsheet,
  guessColumns,
  type ParsedSheet,
  type ColumnGuess,
  type RawRow,
} from "@/lib/spreadsheet";

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
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <StepCategorise
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}

        {step === 5 && (
          <StepSummary
            sheet={sheet}
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

function StepCategorise({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Step 4: Categorise transactions
      </h2>
      <p className="text-base text-muted mb-6">
        Transaction categorisation will be available in a future update. For now,
        all transactions will be imported as-is.
      </p>

      <div className="rounded-lg bg-primary/5 border border-primary/20 p-6 mb-6 text-center">
        <svg className="mx-auto mb-3 text-primary" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-base font-medium text-primary">
          Coming soon — auto-categorisation of income and expenses
        </p>
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
  sheet,
  mapping,
  onBack,
}: {
  sheet: ParsedSheet | null;
  mapping: MappingConfig;
  onBack: () => void;
}) {
  const rows = sheet?.rows ?? [];

  // Calculate totals
  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const row of rows) {
    const raw = String(row[mapping.amountCol] ?? "0");
    const cleaned = raw.replace(/[£$€,\s]/g, "");
    const num = parseFloat(cleaned);
    if (isNaN(num)) continue;

    if (num >= 0) {
      totalIncome += num;
      incomeCount++;
    } else {
      totalExpenses += Math.abs(num);
      expenseCount++;
    }
  }

  const netProfit = totalIncome - totalExpenses;

  const incomeLabel = INCOME_TYPES.find((t) => t.value === mapping.incomeType)?.label ?? mapping.incomeType;
  const taxYearLabel = TAX_YEARS.find((t) => t.value === mapping.taxYear)?.label ?? mapping.taxYear;
  const quarterLabel = QUARTERS.find((q) => q.value === mapping.quarter)?.label ?? mapping.quarter;

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-2">
        Step 5: Quarterly Summary
      </h2>
      <p className="text-base text-muted mb-6">
        Here&rsquo;s an overview of your data for {quarterLabel} of {taxYearLabel}.
      </p>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <SummaryCard
          label="Total Income"
          value={`£${totalIncome.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`}
          sub={`${incomeCount} transactions`}
          colour="success"
        />
        <SummaryCard
          label="Total Expenses"
          value={`£${totalExpenses.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`}
          sub={`${expenseCount} transactions`}
          colour="danger"
        />
        <SummaryCard
          label="Net Profit"
          value={`£${netProfit.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`}
          sub={incomeLabel}
          colour={netProfit >= 0 ? "primary" : "danger"}
        />
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

      <div className="rounded-lg bg-success/10 border border-success/30 p-5 mb-8">
        <div className="flex items-start gap-3">
          <svg className="shrink-0 text-success mt-0.5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <p className="font-bold text-success mb-1">Data processed successfully</p>
            <p className="text-base text-muted">
              {rows.length} transactions imported. You can use this summary for your
              HMRC quarterly submission. Full MTD submission integration is coming soon.
            </p>
          </div>
        </div>
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
  const str = String(val).replace(/[£$€,\s]/g, "");
  const num = parseFloat(str);
  if (isNaN(num)) return String(val);
  return `£${num.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
}
