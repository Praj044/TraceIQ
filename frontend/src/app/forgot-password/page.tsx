"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiPost } from "@/app/lib/api";

type ForgotPasswordResponse = {
  message: string;
  development_reset_url?: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setResetUrl("");
    setError("");
    setLoading(true);

    try {
      const result = await apiPost<ForgotPasswordResponse>(
        "/api/v1/auth/forgot-password",
        { email: email.trim() },
      );

      setMessage(result.message);
      if (result.development_reset_url) {
        setResetUrl(result.development_reset_url);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process your request.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
            T
          </span>
          <span className="text-xl font-bold tracking-tight">TraceIQ</span>
        </Link>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 shadow-sm sm:p-9">
          <p className="mb-2 text-sm font-semibold text-emerald-700">
            ACCOUNT RECOVERY
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Forgot your password?
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Enter the email address associated with your TraceIQ account.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                maxLength={320}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {message && (
              <div role="status" className="break-words rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                {message}
              </div>
            )}

            {resetUrl && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">Development mode only</p>
                <p className="mt-1">No email has been sent. Use this local reset link to test the flow:</p>
                <Link
                  href={resetUrl}
                  className="mt-2 block break-all font-semibold underline"
                >
                  Open password reset
                </Link>
              </div>
            )}

            {error && (
              <p role="alert" className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Processing..." : "Request reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
