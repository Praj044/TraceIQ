"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  FolderKanban,
  GitCompareArrows,
  LogOut,
  Workflow,
} from "lucide-react";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { apiPost } from "@/app/lib/api";
import { AuthGuard } from "@/app/components/auth-guard";

const workspaceItems = [
  {
    title: "Projects",
    description:
      "Create API projects, import OpenAPI specifications, and manage test cases.",
    href: "/projects",
    icon: FolderKanban,
    label: "Manage projects",
  },
  {
    title: "Analytics",
    description:
      "Review API test results, pass rates, response times, and recent activity.",
    href: "/dashboard",
    icon: Activity,
    label: "View analytics",
  },
];

export default function WorkspacePage() {
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setError("");
    setSigningOut(true);

    try {
      await apiPost<void>("/api/v1/auth/logout");
      window.location.assign("/login");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not sign out. Please try again.",
      );
      setSigningOut(false);
    }
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8">
        <Link
          href="/workspace"
          className="text-xl font-bold tracking-tight"
        >
          Trace<span className="text-emerald-500">IQ</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:opacity-60"
          >
            <LogOut size={16} />
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-10 px-5 py-10 sm:px-8 sm:py-14">
        <section className="space-y-4">
          <p className="text-sm font-medium text-emerald-500">
            API QUALITY PLATFORM
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Your workspace.
            <br />
            <span className="text-muted-foreground">
              Your APIs, under control.
            </span>
          </h1>

          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Manage API projects, execute tests, monitor results, and identify
            regressions from one place.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Workspace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose where you want to work.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {workspaceItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-lg"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <Icon size={24} />
                    </div>
                    <ArrowRight
                      size={20}
                      className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-emerald-500"
                    />
                  </div>

                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                  <p className="mt-5 text-sm font-medium text-emerald-500">
                    {item.label}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <GitCompareArrows size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">API regression testing</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Use your projects to run API tests and compare results over
                time. Workflow automation can be added here when its dedicated
                functionality is implemented.
              </p>
              <Link
                href="/projects"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-500 hover:text-emerald-400"
              >
                Open projects <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-border pt-5 text-sm text-muted-foreground">
          TraceIQ · API testing and regression intelligence
        </footer>
      </div>
      </main>
    </AuthGuard>
  );
}