"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiGet, apiPost } from "@/app/lib/api";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { AuthGuard } from "@/app/components/auth-guard";

type Project = {
  id: string;
  name: string;
  description: string | null;
  base_url: string | null;
  created_at: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProjects() {
      try {
        const data = await apiGet<Project[]>("/api/v1/projects");

        if (!cancelled) {
          setProjects(data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load projects.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    setError("");
    try {
      await apiPost<void>("/api/v1/auth/logout");
      window.location.assign("/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not sign out. Please try again.",
      );
    }
  }
  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const project = await apiPost<Project>("/api/v1/projects", {
        name: name.trim(),
        description: description.trim() || null,
        base_url: baseUrl.trim() || null,
      });

      setProjects((current) => [
        project,
        ...current.filter((item) => item.id !== project.id),
      ]);

      setName("");
      setDescription("");
      setBaseUrl("");
      setSuccess("Project created successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create project.",
      );
    } finally {
      setSaving(false);
    }
  }

  const query = search.trim().toLowerCase();

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(query) ||
      (project.base_url ?? "").toLowerCase().includes(query) ||
      (project.description ?? "").toLowerCase().includes(query),
  );

  return (
    <AuthGuard>
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          Trace<span className="text-emerald-500">IQ</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/5"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
        <section>
          <p className="text-sm text-emerald-300">Workspace / Projects</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Projects
          </h1>
          <p className="mt-2 text-muted-foreground">
            Organize APIs and manage the projects you want to test.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="break-words rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm text-emerald-300"
          >
            {success}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form
            onSubmit={createProject}
            className="h-fit space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <div>
              <h2 className="text-lg font-semibold">Create a project</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add an API to your testing workspace.
              </p>
            </div>

            <div>
              <label
                htmlFor="project-name"
                className="mb-2 block text-sm font-medium"
              >
                Project name *
              </label>
              <input
                id="project-name"
                name="name"
                required
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Store API"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-emerald-400"
              />
            </div>

            <div>
              <label
                htmlFor="base-url"
                className="mb-2 block text-sm font-medium"
              >
                Base URL
              </label>
              <input
                id="base-url"
                name="base_url"
                type="url"
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="https://api.example.com"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-emerald-400"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Use the root URL of the API you intend to test.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What does this API do?"
                className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-emerald-400"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating project..." : "+ Create project"}
            </button>
          </form>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Your projects</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Projects stored in your database.
                </p>
              </div>

              <span className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
                {loading ? "Loading..." : `${projects.length} projects`}
              </span>
            </div>

            <div className="mt-5">
              <label htmlFor="project-search" className="sr-only">
                Search projects
              </label>
              <input
                id="project-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, URL, or description..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-emerald-400"
              />
            </div>

            {loading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Loading projects...
              </p>
            ) : filteredProjects.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-medium">
                  {projects.length === 0
                    ? "No projects yet"
                    : "No matching projects"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {projects.length === 0
                    ? "Create a project using the form."
                    : "Try a different search term."}
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {filteredProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-xl border border-border bg-muted/30 p-4 transition hover:border-emerald-400/30 hover:bg-white/5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="wrap-break-word font-medium">
                          {project.name}
                        </h3>
                        <p className="mt-1 break-all text-xs text-muted-foreground">
                          {project.base_url || "No base URL configured"}
                        </p>

                        {project.description && (
                          <p className="mt-2 text-sm leading-5 text-muted-foreground">
                            {project.description}
                          </p>
                        )}
                      </div>

                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">
                        Active
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </section>

        <footer className="border-t border-border pt-5 text-xs text-muted-foreground">
          TraceIQ · API testing and regression intelligence
        </footer>
      </div>
    </main>
    </AuthGuard>
  );
}






