"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
          Sign In
        </h1>
        <p className="text-base text-muted text-center mb-8">
          Enter your email and we&apos;ll send you a magic link to sign in — no password needed.
        </p>

        {status === "sent" ? (
          <div
            className="rounded-lg bg-success/10 border border-success/30 p-6 text-center"
            role="alert"
          >
            <p className="text-lg font-semibold text-success mb-2">
              Check your email
            </p>
            <p className="text-base text-foreground">
              We sent a sign-in link to <strong>{email}</strong>.
              Click the link in the email to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label
                htmlFor="email"
                className="block text-base font-medium mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 rounded-lg border border-border bg-card px-4 text-base text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {status === "error" && (
              <p className="text-base text-danger" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="h-12 rounded-lg bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending link…" : "Send Magic Link"}
            </button>
          </form>
        )}

        <p className="text-base text-muted text-center mt-8">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
