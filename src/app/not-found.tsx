import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-20 sm:py-32 text-center">
      <p className="text-6xl font-bold text-primary mb-4">404</p>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">
        Page not found
      </h1>
      <p className="text-lg text-muted mb-8 leading-relaxed">
        Sorry, we couldn&rsquo;t find the page you&rsquo;re looking for. It may
        have been moved or doesn&rsquo;t exist.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex h-[48px] items-center justify-center rounded-lg bg-primary px-8 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go to homepage
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-[48px] items-center justify-center rounded-lg border-2 border-primary px-8 text-lg font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
