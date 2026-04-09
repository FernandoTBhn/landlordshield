import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Landing page — LandlordShield                                     */
/*  Persona: 55+ landlords, 1–5 properties, not tech-savvy            */
/*  Design: large text, high contrast, generous spacing, serif heads   */
/* ------------------------------------------------------------------ */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LandlordShield",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://landlordshield.co.uk",
  description:
    "UK landlord compliance software. Track gas safety, EPC, deposit protection, Information Sheets and more. Know if you're compliant with the Renters' Rights Act in 5 minutes.",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
      name: "Free",
      description: "1 property, full compliance checklist",
    },
    {
      "@type": "Offer",
      price: "99",
      priceCurrency: "GBP",
      name: "Shield",
      description: "Unlimited properties, expiry alerts, priority support",
      billingDuration: "P1Y",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "47",
    bestRating: "5",
  },
};

function getDaysUntilDeadline() {
  const deadline = new Date("2026-05-31T23:59:59Z");
  const now = new Date();
  return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function Home() {
  const daysLeft = getDaysUntilDeadline();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ═══════════════════════  HERO  ═══════════════════════ */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, #fff 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28 lg:py-36 text-center">
          {/* Urgency badge */}
          <span className="inline-flex items-center gap-2.5 rounded-full bg-danger px-5 py-2 text-base font-bold text-white mb-8 shadow-lg">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
            </span>
            Deadline: 31 May 2026 — {daysLeft} days left
          </span>

          <h1 className="text-[2rem] sm:text-[2.75rem] lg:text-[3.5rem] font-bold leading-[1.12] tracking-tight text-white mb-6 max-w-4xl mx-auto" style={{ color: "#FFFFFF" }}>
            Know if you&rsquo;re compliant with the Renters&rsquo; Rights Act
            &mdash;&nbsp;in&nbsp;5&nbsp;minutes
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            The Information Sheet deadline is{" "}
            <strong className="text-white">31&nbsp;May&nbsp;2026</strong>. The fine is up
            to <strong style={{ color: "#F5C842" }}>&pound;7,000 per tenancy</strong>.
            Don&rsquo;t wait until it&rsquo;s too late.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex h-14 items-center justify-center rounded-lg bg-white px-10 text-lg font-bold text-primary transition-all hover:bg-primary-foreground/90 hover:scale-[1.02] shadow-lg"
            >
              Start free — no card required
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-14 items-center justify-center rounded-lg border-2 border-white/30 px-10 text-lg font-semibold text-white transition-colors hover:bg-white/10"
            >
              See how it works
            </a>
          </div>

          <p className="mt-6 text-sm text-primary-foreground/60">
            Free for your first property. Upgrade anytime.
          </p>
        </div>
      </section>

      {/* ═══════════  WHAT LANDLORDSHIELD DOES  ═══════════ */}
      <section
        id="how-it-works"
        className="py-20 sm:py-28"
        aria-labelledby="what-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2
              id="what-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            >
              What LandlordShield does
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Three things that keep you on the right side of the law — without
              drowning in paperwork.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <FeatureCard
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
              title="Serve the Information Sheet with proof"
              description="Generate the legally required Prescribed Information PDF and email it directly to your tenant. We store the date and delivery record so you have proof if challenged."
            />
            <FeatureCard
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
              title="Track certificates with expiry alerts"
              description="Gas safety, EICR, EPC, deposit protection and smoke alarms — all tracked in one checklist. We email you at 60, 30 and 14 days before anything expires."
            />
            <FeatureCard
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                </svg>
              }
              title="See your compliance score instantly"
              description="A simple 0–100 score for every property. Green means you're safe. Red means something needs attention. No jargon, no guesswork."
            />
          </div>
        </div>
      </section>

      {/* ═══════════  BUILT FOR LANDLORDS  ═══════════ */}
      <section
        className="py-20 sm:py-28 bg-card"
        aria-labelledby="comparison-heading"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2
              id="comparison-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            >
              Built for landlords, not property investors
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              Most software is designed for agencies with 200 units. You manage
              a few properties and just want to know you&rsquo;re legal.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Us */}
            <div className="rounded-xl border-2 border-success/30 bg-success/[0.04] p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-success/15 border border-success/30 px-3 py-1 mb-6">
                <span className="block h-2.5 w-2.5 rounded-full bg-success" aria-hidden="true" />
                <span className="text-sm font-bold text-success">LandlordShield</span>
              </div>
              <ul className="space-y-4" role="list">
                <ComparisonItem positive text="5 screens — dashboard, property, add, login, report" />
                <ComparisonItem positive text="Add a property in under 2 minutes" />
                <ComparisonItem positive text="Plain English — no jargon or acronyms" />
                <ComparisonItem positive text="Large text and buttons — easy to read" />
                <ComparisonItem positive text="Built around UK compliance law" />
              </ul>
            </div>

            {/* Them */}
            <div className="rounded-xl border border-border bg-card p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-muted/10 border border-border px-3 py-1 mb-6">
                <span className="block h-2.5 w-2.5 rounded-full bg-muted" aria-hidden="true" />
                <span className="text-sm font-bold text-muted">Typical property software</span>
              </div>
              <ul className="space-y-4" role="list">
                <ComparisonItem text="30+ menus, tabs and sub-pages" />
                <ComparisonItem text="Setup takes hours, needs a tutorial" />
                <ComparisonItem text="Full of industry jargon" />
                <ComparisonItem text="Tiny text, cluttered interface" />
                <ComparisonItem text="General-purpose — not compliance-focused" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════  URGENCY TIMELINE  ═══════════ */}
      <section
        className="py-20 sm:py-28"
        aria-labelledby="timeline-heading"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2
              id="timeline-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            >
              Key dates you can&rsquo;t afford to miss
            </h2>
            <p className="text-lg text-muted max-w-2xl mx-auto">
              The Renters&rsquo; Rights Act is already law. These deadlines are
              coming whether you&rsquo;re ready or not.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-border"
              aria-hidden="true"
            />

            <div className="flex flex-col gap-10">
              <TimelineItem
                date="1 May 2026"
                title="Renters' Rights Act — Phase 1"
                description="New tenancies fall under the Act. Section 21 'no-fault' evictions are abolished for new lets."
                colour="warning"
              />
              <TimelineItem
                date="31 May 2026"
                title="Information Sheet deadline"
                description="All landlords must serve the Government-prescribed Information Sheet to every tenant. Fines up to £7,000 per tenancy for non-compliance."
                colour="danger"
                highlight
              />
              <TimelineItem
                date="July 2026"
                title="Making Tax Digital — Q1 deadline"
                description="First quarterly HMRC submission for landlords with income over £50,000. Digital record-keeping is now required."
                colour="primary"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════  PRICING  ═══════════ */}
      <section
        className="py-20 sm:py-28 bg-card"
        aria-labelledby="pricing-heading"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2
              id="pricing-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            >
              Simple pricing, no surprises
            </h2>
            <p className="text-lg text-muted max-w-xl mx-auto">
              Start free. Upgrade only when you need more properties.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-xl border border-border bg-background p-8 flex flex-col">
              <h3 className="text-xl font-bold mb-1">Free</h3>
              <p className="text-muted text-base mb-6">For your first property</p>
              <p className="text-4xl font-bold mb-1">&pound;0</p>
              <p className="text-muted text-sm mb-8">Forever</p>
              <ul className="space-y-3 mb-8 flex-1" role="list">
                <PricingFeature text="1 property" />
                <PricingFeature text="Full compliance checklist" />
                <PricingFeature text="Information Sheet with email delivery" />
                <PricingFeature text="Compliance score" />
                <PricingFeature text="PDF compliance report" />
              </ul>
              <Link
                href="/signup"
                className="inline-flex h-14 w-full items-center justify-center rounded-lg border-2 border-primary px-6 text-lg font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                Get started free
              </Link>
            </div>

            {/* Shield */}
            <div className="relative rounded-xl border-2 border-primary bg-background p-8 flex flex-col shadow-lg">
              <div className="absolute -top-3.5 left-6 rounded-full bg-primary px-4 py-1 text-sm font-bold text-primary-foreground">
                Most popular
              </div>
              <h3 className="text-xl font-bold mb-1">Shield</h3>
              <p className="text-muted text-base mb-6">For serious landlords</p>
              <p className="text-4xl font-bold mb-1">
                &pound;99<span className="text-lg font-normal text-muted">/year</span>
              </p>
              <p className="text-muted text-sm mb-8">
                Less than &pound;2/week
              </p>
              <ul className="space-y-3 mb-8 flex-1" role="list">
                <PricingFeature text="Unlimited properties" highlight />
                <PricingFeature text="Everything in Free" />
                <PricingFeature text="Expiry email alerts (60, 30, 14 days)" highlight />
                <PricingFeature text="Priority support" />
                <PricingFeature text="Compliance history export" />
              </ul>
              <Link
                href="/signup"
                className="inline-flex h-14 w-full items-center justify-center rounded-lg bg-primary px-6 text-lg font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.01] shadow-md"
              >
                Start free, upgrade later
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════  FAQ  ═══════════ */}
      <section
        className="py-20 sm:py-28"
        aria-labelledby="faq-heading"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2
            id="faq-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-14"
          >
            Frequently asked questions
          </h2>

          <div className="flex flex-col gap-6">
            <FaqItem
              question="What is the Information Sheet I need to serve?"
              answer="Under Section 213 of the Housing Act 2004, landlords must give tenants 'prescribed information' about their deposit within 30 days. The Renters' Rights Act introduces a new Government-issued Information Sheet that must also be served. Failure to comply can result in fines up to £7,000 per tenancy."
            />
            <FaqItem
              question="I only have one property — do I still need this?"
              answer="Yes. The law applies to every tenancy, whether you have one property or one hundred. LandlordShield is free for your first property, so there's no reason not to check your compliance."
            />
            <FaqItem
              question="How does the compliance score work?"
              answer="Your score runs from 0 to 100. It's based on three things: whether you've served the Information Sheet (30%), whether your five key certificates are valid (50%), and whether your tenancy type is recorded (20%). Green means compliant, yellow means something needs attention, red means action required."
            />
            <FaqItem
              question="Will you remind me before certificates expire?"
              answer="Yes. On the Shield plan, we send you email reminders at 60, 30 and 14 days before any certificate expires. You'll never be caught off guard."
            />
            <FaqItem
              question="Is my data safe?"
              answer="Your data is stored securely on Supabase with row-level security — only you can access your properties and documents. We never share your data with third parties."
            />
          </div>
        </div>
      </section>

      {/* ═══════════  FINAL CTA  ═══════════ */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 sm:py-24 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6">
            Don&rsquo;t risk a &pound;7,000 fine
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto mb-10">
            Check your compliance in 5 minutes. It&rsquo;s free for your first
            property and takes less time than making a cup of tea.
          </p>
          <Link
            href="/signup"
            className="inline-flex h-14 items-center justify-center rounded-lg bg-white px-12 text-lg font-bold text-primary transition-all hover:bg-primary-foreground/90 hover:scale-[1.02] shadow-lg"
          >
            Start free — no card required
          </Link>
        </div>
      </section>

      {/* ═══════════  TRUST FOOTER  ═══════════ */}
      <section className="border-t border-border py-10" aria-label="Trust signals">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              256-bit SSL encrypted
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              GDPR compliant
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              UK-based company
            </span>
            <span className="inline-flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Sub-components ────────────────────────────────── */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md">
      <div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-3 mb-5 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-base text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function ComparisonItem({
  text,
  positive,
}: {
  text: string;
  positive?: boolean;
}) {
  return (
    <li className="flex items-start gap-3">
      {positive ? (
        <svg className="mt-0.5 shrink-0 text-success" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg className="mt-0.5 shrink-0 text-muted" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
      <span className={`text-base leading-snug ${positive ? "text-foreground" : "text-muted"}`}>
        {text}
      </span>
    </li>
  );
}

function TimelineItem({
  date,
  title,
  description,
  colour,
  highlight,
}: {
  date: string;
  title: string;
  description: string;
  colour: "primary" | "warning" | "danger";
  highlight?: boolean;
}) {
  const dotColours = {
    primary: "bg-primary",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  return (
    <div className="relative pl-16 sm:pl-20">
      {/* Dot */}
      <div
        className={`absolute left-[17px] sm:left-[23px] top-1 h-4 w-4 rounded-full border-[3px] border-background ${dotColours[colour]}`}
        aria-hidden="true"
      />
      <p className={`text-sm font-bold uppercase tracking-wide mb-1 ${colour === "danger" ? "text-danger" : colour === "warning" ? "text-warning" : "text-primary"}`}>
        {date}
      </p>
      <h3 className={`text-lg sm:text-xl font-bold mb-2 ${highlight ? "text-danger" : ""}`}>
        {title}
      </h3>
      <p className="text-base text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function PricingFeature({
  text,
  highlight,
}: {
  text: string;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-center gap-2.5">
      <svg className="shrink-0 text-success" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span className={`text-base ${highlight ? "font-semibold text-foreground" : "text-muted"}`}>
        {text}
      </span>
    </li>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer items-center justify-between gap-4 p-6 text-lg font-bold list-none [&::-webkit-details-marker]:hidden">
        {question}
        <svg
          className="shrink-0 text-muted transition-transform group-open:rotate-180"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="px-6 pb-6 text-base text-muted leading-relaxed -mt-1">
        {answer}
      </div>
    </details>
  );
}
