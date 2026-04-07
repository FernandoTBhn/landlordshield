import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-base">
            &copy; {currentYear} LandlordShield. All rights reserved.
          </p>
          <nav
            className="flex items-center gap-6"
            aria-label="Footer navigation"
          >
            <Link
              href="/privacy"
              className="text-base hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-base hover:text-white transition-colors"
            >
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
