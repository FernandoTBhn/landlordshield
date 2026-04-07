export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero */}
      <section className="text-center py-12 sm:py-20">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
          UK Landlord Compliance,
          <br />
          Made Simple
        </h1>
        <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Track gas safety certificates, EPC ratings, deposit protection,
          Right to Rent checks and more — all in one place.
          Never miss a deadline again.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started Free
          </a>
          <a
            href="/learn-more"
            className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-primary px-8 text-base font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-12" aria-labelledby="features-heading">
        <h2
          id="features-heading"
          className="text-2xl sm:text-3xl font-bold text-center mb-10"
        >
          Everything You Need to Stay Compliant
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Gas Safety"
            description="Track CP12 certificates and get reminders before they expire. Never risk a fine."
            status="compliance"
          />
          <FeatureCard
            title="EPC Ratings"
            description="Monitor Energy Performance Certificates across all your properties."
            status="compliance"
          />
          <FeatureCard
            title="Deposit Protection"
            description="Ensure every tenancy deposit is properly registered and prescribed information served."
            status="compliance"
          />
          <FeatureCard
            title="Right to Rent"
            description="Record and track Right to Rent checks with follow-up date reminders."
            status="compliance"
          />
          <FeatureCard
            title="Electrical Safety"
            description="EICR tracking with 5-year renewal reminders for every property."
            status="compliance"
          />
          <FeatureCard
            title="Deadline Alerts"
            description="Email reminders sent well in advance so you always have time to act."
            status="alerts"
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-base text-muted leading-relaxed">{description}</p>
    </div>
  );
}
