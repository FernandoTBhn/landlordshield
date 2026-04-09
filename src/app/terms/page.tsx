import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="prose-landlord flex flex-col gap-6 text-base text-muted leading-relaxed">
        <p>
          <strong className="text-foreground">Last updated:</strong> April 2026
        </p>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            About these terms
          </h2>
          <p>
            By using LandlordShield you agree to these terms. If you do not
            agree, please do not use the service. We may update these terms from
            time to time — we will notify you by email if we make material
            changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            What LandlordShield provides
          </h2>
          <p>
            LandlordShield is a compliance tracking tool. It helps you organise
            certificates, serve prescribed information, and monitor deadlines.
            It does <strong className="text-foreground">not</strong> constitute
            legal advice. Always consult a qualified solicitor or professional
            adviser for legal matters.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            Your responsibilities
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              You are responsible for the accuracy of the data you enter.
            </li>
            <li>
              You must not use the service for any unlawful purpose.
            </li>
            <li>
              You must keep your login credentials secure and not share your
              account.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            Free and paid plans
          </h2>
          <p>
            The Free plan includes one property with full features. The Shield
            plan (&pound;99/year) includes unlimited properties and additional
            features. You can cancel the Shield plan at any time and receive a
            pro-rata refund for unused months.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            Limitation of liability
          </h2>
          <p>
            LandlordShield is provided &ldquo;as is&rdquo;. We do our best to
            ensure accuracy, but we cannot guarantee that the information or
            alerts will be error-free. We are not liable for any fines,
            penalties, or losses resulting from reliance on the service. You
            remain solely responsible for your legal compliance obligations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            Termination
          </h2>
          <p>
            You can delete your account at any time. We may suspend or terminate
            accounts that violate these terms. On termination, your data is
            permanently deleted within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">
            Governing law
          </h2>
          <p>
            These terms are governed by the laws of England and Wales. Any
            disputes will be subject to the exclusive jurisdiction of the courts
            of England and Wales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">Contact</h2>
          <p>
            Questions about these terms? Email us at{" "}
            <a
              href="mailto:hello@landlordshield.co.uk"
              className="text-primary font-medium hover:underline"
            >
              hello@landlordshield.co.uk
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
