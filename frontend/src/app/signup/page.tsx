
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/app/lib/api";

type UserResponse = {
  id: string;
  name: string;
  email: string;
};

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 12) {
      setError("Password must contain at least 12 characters.");
      return;
    }

    setLoading(true);

    try {
      await apiPost<UserResponse>("/api/v1/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      router.replace("/workspace");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create your account.",
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
            GET STARTED
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Build confidence in every API release with TraceIQ.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="At least 12 characters"
              />
              <p className="mt-2 text-xs text-[var(--muted)]">
                Use 12–128 characters.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="break-words rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Sign in
            </Link>
          </p>
        </section>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          API testing and regression intelligence.
        </p>
      </div>
    </main>
  );
}
