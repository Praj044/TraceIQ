"use client";

import { Suspense, FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiPost } from "@/app/lib/api";

type ResetPasswordResponse = {
  message: string;
};

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("The reset link is missing its token. Request a new link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await apiPost<ResetPasswordResponse>(
        "/api/v1/auth/reset-password",
        { token, new_password: password }
      );

      setMessage(result.message);
      setPassword("");
      setConfirmPassword("");
      window.setTimeout(() => router.replace("/login"), 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reset your password."
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
            Set a new password
          </h1>

          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Choose a new password of at least 12 characters.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {message && (
              <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                {message}
              </p>
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
              {loading ? "Updating password..." : "Reset password"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
              Back to sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-[var(--muted)]">
            Loading password reset...
          </p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
