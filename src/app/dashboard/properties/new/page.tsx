"use client";

import { useActionState } from "react";
import Link from "next/link";
import { addProperty, type AddPropertyState } from "./actions";

const tenancyOptions = [
  {
    value: "ast_periodic",
    label: "Periodic (month-to-month)",
    help: "The most common type. The tenancy continues month-to-month after any fixed term ends.",
  },
  {
    value: "fixed",
    label: "Fixed Term",
    help: "The tenancy has a set end date (e.g. 12 months). Choose this if the fixed term hasn't ended yet.",
  },
  {
    value: "other",
    label: "Other",
    help: "Licence, lodger agreement, or any arrangement that isn't a standard AST.",
  },
] as const;

export default function NewPropertyPage() {
  const [state, formAction, isPending] = useActionState<AddPropertyState, FormData>(
    addProperty,
    {},
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-base font-medium text-primary hover:underline mb-8"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12.5 15L7.5 10L12.5 5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to Dashboard
      </Link>

      <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Add a Property
        </h1>
        <p className="text-base text-muted mb-8">
          Enter the property address and tenant details. You can add
          certificates and more information later.
        </p>

        <form action={formAction} className="flex flex-col gap-6">
          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-lg font-medium mb-2"
            >
              Property Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              autoComplete="street-address"
              placeholder="e.g. 12 Oak Lane, Manchester, M1 2AB"
              className="w-full h-[48px] rounded-lg border border-border bg-card px-4 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          {/* Tenant Name */}
          <div>
            <label
              htmlFor="tenantName"
              className="block text-lg font-medium mb-2"
            >
              Tenant Name
            </label>
            <input
              id="tenantName"
              name="tenantName"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. John Smith"
              className="w-full h-[48px] rounded-lg border border-border bg-card px-4 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          {/* Tenant Email */}
          <div>
            <label
              htmlFor="tenantEmail"
              className="block text-lg font-medium mb-2"
            >
              Tenant Email
              <span className="text-muted font-normal ml-2">(recommended)</span>
            </label>
            <input
              id="tenantEmail"
              name="tenantEmail"
              type="email"
              autoComplete="email"
              placeholder="e.g. john@example.com"
              className="w-full h-[48px] rounded-lg border border-border bg-card px-4 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
            <p className="text-sm text-muted mt-1.5">
              We need this to email the Information Sheet to your tenant. You can add it later.
            </p>
          </div>

          {/* Tenancy Type */}
          <fieldset>
            <legend className="text-lg font-medium mb-3">
              Tenancy Type
            </legend>
            <p className="text-sm text-muted mb-3">
              Not sure? Most private tenancies are &ldquo;Periodic&rdquo; — the tenancy rolls on month-to-month.
            </p>
            <div className="flex flex-col gap-3">
              {tenancyOptions.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 cursor-pointer has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-ring transition-all"
                >
                  <input
                    type="radio"
                    name="tenancyType"
                    value={opt.value}
                    defaultChecked={opt.value === "ast_periodic"}
                    className="h-5 w-5 accent-primary mt-0.5"
                  />
                  <div>
                    <span className="text-base font-medium">{opt.label}</span>
                    <p className="text-sm text-muted mt-0.5">{opt.help}</p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Error */}
          {state.error && (
            <p className="text-base text-danger font-medium" role="alert">
              {state.error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="h-[48px] rounded-lg bg-primary text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? "Saving…" : "Add Property"}
          </button>
        </form>
      </div>
    </div>
  );
}
