import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose-landlord flex flex-col gap-6 text-base text-muted leading-relaxed">
        <p>
          <strong className="text-foreground">Last updated:</strong> April 2026
        </p>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            Who we are
          </h2>
          <p>
            LandlordShield is a UK-based compliance tool for private landlords.
            We help you track certificates, serve prescribed information, and
            stay on the right side of the Renters&rsquo; Rights Act.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            What data we collect
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">Account information:</strong>{" "}
              email address and password (hashed) when you sign up.
            </li>
            <li>
              <strong className="text-foreground">Property data:</strong>{" "}
              addresses, tenant names, tenancy details, and certificate dates
              you enter.
            </li>
            <li>
              <strong className="text-foreground">Usage data:</strong>{" "}
              anonymised analytics via PostHog to understand how people use the
              product.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            How we use your data
          </h2>
          <p>
            We use your data solely to provide the LandlordShield service:
            displaying your compliance dashboard, generating PDFs, sending
            certificate expiry alerts, and emailing prescribed information to
            your tenants on your behalf.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            Who we share it with
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">Supabase</strong> — database
              and authentication (EU-hosted).
            </li>
            <li>
              <strong className="text-foreground">Resend</strong> — email
              delivery for Information Sheets and alerts.
            </li>
            <li>
              <strong className="text-foreground">PostHog</strong> — anonymised
              product analytics.
            </li>
          </ul>
          <p className="mt-3">
            We never sell your data to third parties. We never share tenant
            personal information beyond what is required to deliver emails you
            have explicitly requested.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            Your rights
          </h2>
          <p>
            Under GDPR you can request access to, correction of, or deletion of
            your personal data at any time. Contact us at{" "}
            <a
              href="mailto:privacy@landlordshield.co.uk"
              className="text-primary font-medium hover:underline"
            >
              privacy@landlordshield.co.uk
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            Data retention
          </h2>
          <p>
            We keep your data for as long as your account is active. If you
            delete your account, all associated data is permanently removed
            within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">Security</h2>
          <p>
            All data is encrypted in transit (TLS 1.3) and at rest. Database
            access is protected by row-level security — only you can see your
            own properties and documents.
          </p>
        </section>
      </div>
    </div>
  );
}
