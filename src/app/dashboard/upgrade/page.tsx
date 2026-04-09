import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upgrade to Shield",
};

export default function UpgradePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-20">
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

      <div className="rounded-xl border-2 border-primary bg-card p-8 sm:p-10 shadow-lg text-center">
        {/* Shield icon */}
        <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          You&rsquo;ve reached the free plan limit
        </h1>
        <p className="text-lg text-muted mb-8 max-w-md mx-auto leading-relaxed">
          The free plan covers 1 property. Upgrade to{" "}
          <strong className="text-foreground">Shield</strong> to manage all your
          properties in one place.
        </p>

        <div className="rounded-xl border border-border bg-background p-6 sm:p-8 mb-8 text-left">
          <h2 className="text-xl font-bold mb-1">
            Shield Plan
          </h2>
          <p className="text-3xl font-bold mb-1">
            &pound;99<span className="text-lg font-normal text-muted">/year</span>
          </p>
          <p className="text-sm text-muted mb-6">Less than &pound;2/week</p>

          <ul className="space-y-3" role="list">
            {[
              "Unlimited properties",
              "Everything in the Free plan",
              "Expiry email alerts at 60, 30 and 14 days",
              "Priority support",
              "Compliance history export",
              "PDF compliance reports for every property",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2.5">
                <svg
                  className="shrink-0 text-success"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-base">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <a
          href="mailto:hello@landlordshield.co.uk?subject=Shield%20Plan%20Upgrade"
          className="inline-flex h-14 w-full items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-md mb-4"
        >
          Upgrade to Shield — &pound;99/year
        </a>
        <p className="text-sm text-muted">
          Cancel anytime. 30-day money-back guarantee.
        </p>
      </div>
    </div>
  );
}
