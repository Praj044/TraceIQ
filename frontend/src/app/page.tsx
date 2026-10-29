
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type Project = {
  id: string;
  name: string;
  description: string | null;
  base_url: string | null;
  created_at: string;
};

type ProjectSummary = {
  project_id: string;
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  pass_rate_percent: number;
  average_response_time_ms: number | null;
  last_run_at: string | null;
};

type ActivityItem = {
  projectName: string;
  lastRunAt: string;
  totalRuns: number;
  failedRuns: number;
};

function formatResponseTime(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(2)} ms`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [summaries, setSummaries] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setAnalyticsLoading(true);
      setError("");
      setAnalyticsError("");

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/projects`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Projects API returned HTTP ${response.status}`);
        }

        const projectData: Project[] = await response.json();

        if (!active) return;

        setProjects(projectData);
        setLoading(false);

        const results = await Promise.allSettled(
          projectData.map(async (project) => {
            const summaryResponse = await fetch(
              `${API_BASE_URL}/api/v1/projects/${project.id}/test-runs/summary`,
              { cache: "no-store" },
            );

            if (!summaryResponse.ok) {
              throw new Error(
                `Summary API returned HTTP ${summaryResponse.status}`,
              );
            }

            return (await summaryResponse.json()) as ProjectSummary;
          }),
        );

        if (!active) return;

        const successfulSummaries = results
          .filter(
            (
              result,
            ): result is PromiseFulfilledResult<ProjectSummary> =>
              result.status === "fulfilled",
          )
          .map((result) => result.value);

        setSummaries(successfulSummaries);

        if (results.some((result) => result.status === "rejected")) {
          setAnalyticsError(
            "Some project summaries could not be loaded. Displayed metrics may be incomplete.",
          );
        }
      } catch {
        if (active) {
          setError(
            "Could not load projects. Check that FastAPI is running and the API URL is correct.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
          setAnalyticsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const totalRuns = summaries.reduce(
    (total, summary) => total + summary.total_runs,
    0,
  );

  const passedRuns = summaries.reduce(
    (total, summary) => total + summary.passed_runs,
    0,
  );

  const failedRuns = summaries.reduce(
    (total, summary) => total + summary.failed_runs,
    0,
  );

  const passRate =
    totalRuns > 0
      ? `${((passedRuns / totalRuns) * 100).toFixed(2)}%`
      : "—";

  const summariesWithResponseTime = summaries.filter(
    (summary) => summary.average_response_time_ms !== null,
  );

  const responseTimeWeight = summariesWithResponseTime.reduce(
    (total, summary) => total + summary.total_runs,
    0,
  );

  const averageResponseTime =
    responseTimeWeight > 0
      ? summariesWithResponseTime.reduce(
          (total, summary) =>
            total +
            (summary.average_response_time_ms ?? 0) * summary.total_runs,
          0,
        ) / responseTimeWeight
      : null;

  const stats = [
    {
      label: "Total test runs",
      value: analyticsLoading ? "…" : String(totalRuns),
      detail: "Across loaded projects",
    },
    {
      label: "Pass rate",
      value: analyticsLoading ? "…" : passRate,
      detail: `${passedRuns} successful runs`,
    },
    {
      label: "Failed tests",
      value: analyticsLoading ? "…" : String(failedRuns),
      detail: "Runs that need investigation",
    },
    {
      label: "Avg. response",
      value: analyticsLoading
        ? "…"
        : formatResponseTime(averageResponseTime),
      detail: "Based on project summaries",
    },
  ];

  const activity: ActivityItem[] = projects
    .map((project) => {
      const summary = summaries.find(
        (item) => item.project_id === project.id,
      );

      if (!summary?.last_run_at) return null;

      return {
        projectName: project.name,
        lastRunAt: summary.last_run_at,
        totalRuns: summary.total_runs,
        failedRuns: summary.failed_runs,
      };
    })
    .filter((item): item is ActivityItem => item !== null)
    .sort(
      (a, b) =>
        new Date(b.lastRunAt).getTime() -
        new Date(a.lastRunAt).getTime(),
    )
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-slate-950 p-6 md:flex md:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 font-bold text-slate-950">
              T
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                TraceIQ
              </h1>
              <p className="text-xs text-slate-400">API intelligence</p>
            </div>
          </div>

          <p className="mb-3 mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            <a
              href="#overview"
              className="flex items-center gap-3 rounded-xl bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-300"
            >
              <span>▦</span> Overview
            </a>
            <a
              href="#projects"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>◇</span> Projects
            </a>
            <a
              href="#tests"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>⌘</span> Test runs
            </a>
            <a
              href="#activity"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <span>◷</span> Activity
            </a>
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/3 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <p className="text-sm font-medium">Local environment</p>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              TraceIQ API testing workspace
            </p>
            <p className="mt-3 text-xs text-emerald-300">
              Backend integration active
            </p>
          </div>
        </aside>

        <section id="overview" className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8">
            <div>
              <p className="text-sm text-slate-400">
                Workspace / Overview
              </p>
              <h2 className="mt-1 text-xl font-semibold">Dashboard</h2>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
              ● API testing
            </span>
          </header>

          <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
            <section className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-linear-to-br from-emerald-950 via-slate-900 to-slate-900 p-6 sm:p-9">
              <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="relative max-w-2xl">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
                  API quality, at a glance
                </span>
                <h3 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Know when your APIs{" "}
                  <span className="text-emerald-400">break.</span>
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  Import an OpenAPI specification, define assertions, run
                  tests, and track regressions from one workspace.
                </p>
                <a
                  href="#projects"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                >
                  Explore workspace <span>→</span>
                </a>
              </div>
            </section>

            <section id="tests">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Testing overview</h3>
                <p className="mt-1 text-sm text-slate-400">
                  A snapshot of your API quality
                </p>
              </div>

              {analyticsError && (
                <p
                  role="status"
                  className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200"
                >
                  {analyticsError}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                  <article
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-emerald-400/30"
                  >
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {stat.detail}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section
              id="projects"
              className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]"
            >
              <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">Your projects</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      API collections under test
                    </p>
                  </div>
                  <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400">
                    {loading ? "Loading…" : `${projects.length} projects`}
                  </span>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300"
                  >
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="mt-6 rounded-xl border border-white/10 p-8 text-center text-sm text-slate-400">
                    Loading projects…
                  </div>
                ) : !error && projects.length === 0 ? (
                  <div className="mt-6 flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-5 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-300">
                      ◇
                    </div>
                    <h4 className="mt-4 font-medium">No projects yet</h4>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                      Create your first project using the TraceIQ API.
                    </p>
                  </div>
                ) : !error ? (
                  <div className="mt-6 space-y-3">
                    {projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block rounded-xl border border-white/10 bg-white/2 p-4 transition hover:border-emerald-400/50 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="wrap-break-word font-medium">
                              {project.name}
                            </h4>
                            <p className="mt-1 break-all text-xs text-slate-400">
                              {project.base_url ||
                                "No base URL configured"}
                            </p>
                            {project.description && (
                              <p className="mt-2 text-sm text-slate-400">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">
                            Project →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </article>

              <article
                id="activity"
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 sm:p-6"
              >
                <h3 className="font-semibold">Recent activity</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Latest test executions by project
                </p>

                <div className="mt-6 space-y-3">
                  {analyticsLoading ? (
                    <p className="rounded-xl bg-white/3 p-4 text-sm text-slate-400">
                      Loading activity…
                    </p>
                  ) : activity.length === 0 ? (
                    <p className="rounded-xl bg-white/3 p-4 text-sm leading-6 text-slate-400">
                      No test runs recorded yet. Run a test case to see
                      activity here.
                    </p>
                  ) : (
                    activity.map((item) => (
                      <div
                        key={`${item.projectName}-${item.lastRunAt}`}
                        className="rounded-xl bg-white/3 p-4"
                      >
                        <p className="wrap-break-word text-sm font-medium">
                          {item.projectName}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Last run: {formatDate(item.lastRunAt)}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {item.totalRuns} total runs · {item.failedRuns} failed
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <footer className="flex flex-wrap justify-between gap-2 border-t border-white/10 pt-5 text-xs text-slate-500">
              <p>TraceIQ · API testing and regression intelligence</p>
              <p>Development environment · v0.1.0</p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
