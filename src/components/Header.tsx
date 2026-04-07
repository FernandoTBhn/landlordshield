"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading), Georgia, serif" }}
          >
            LandlordShield
          </Link>

          {/* Desktop nav — visible on tablet+ (no hamburger for 55+ users) */}
          <nav
            className="hidden sm:flex items-center gap-6"
            aria-label="Main navigation"
          >
            <Link
              href="/"
              className="text-base font-medium text-primary-foreground/90 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="text-base font-medium text-primary-foreground/90 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
            >
              Sign In
            </Link>
          </nav>

          {/* Mobile menu button — only on small screens */}
          <button
            type="button"
            className="sm:hidden inline-flex h-12 w-12 items-center justify-center rounded-lg text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav
            id="mobile-menu"
            className="sm:hidden border-t border-primary-foreground/20 py-4"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="block rounded-lg px-4 py-3 text-base font-medium text-primary-foreground/90 hover:bg-primary-foreground/10 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="block rounded-lg px-4 py-3 text-base font-medium text-primary-foreground/90 hover:bg-primary-foreground/10 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
