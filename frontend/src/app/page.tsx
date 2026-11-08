"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Activity,
  Check,
  ChevronRight,
  CircleDot,
  Code2,
  Command,
  GitCompareArrows,
  Layers3,
  Moon,
  Play,
  Radio,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

const features = [
  {
    number: "01",
    icon: Code2,
    title: "Import your API",
    description:
      "Bring an OpenAPI specification into a workspace and turn an API definition into an organized testing surface.",
    tag: "SPEC â†’ WORKSPACE",
  },
  {
    number: "02",
    icon: Zap,
    title: "Execute with confidence",
    description:
      "Run API test cases, inspect responses, and keep the execution workflow close to the endpoints you care about.",
    tag: "REQUEST â†’ RESULT",
  },
  {
    number: "03",
    icon: GitCompareArrows,
    title: "Catch what changed",
    description:
      "Compare test runs, inspect changed outcomes, and identify regressions before they become someone else's problem.",
    tag: "BASELINE â†’ DIFF",
  },
];

const traces = [
  { method: "GET", path: "/api/v1/users", status: "200", time: "42 ms" },
  { method: "POST", path: "/api/v1/orders", status: "201", time: "86 ms" },
  { method: "GET", path: "/api/v1/products", status: "200", time: "31 ms" },
  { method: "PATCH", path: "/api/v1/profile", status: "200", time: "57 ms" },
];

function ThemeButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={`Switch to ${dark ? "light" : "dark"} mode`}
      title={`Switch to ${dark ? "light" : "dark"} mode`}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] transition hover:-translate-y-0.5 hover:border-emerald-400"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function TracePreview() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24, rotateX: 5 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.15 }}
      className="relative mx-auto w-full max-w-2xl"
      style={{ perspective: 1200 }}
    >
      <div className="ambient-glow pointer-events-none absolute -inset-10 opacity-80 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-emerald-950/10">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 font-mono text-xs text-[var(--muted)]">
              traceiq / run-inspector
            </span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-emerald-500">
            <span className="animate-traceiq-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" />
            SIMULATED PREVIEW
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-[var(--border)] p-3 sm:gap-3 sm:p-5">
          {[
            { label: "Requests", value: "024", icon: Activity },
            { label: "Passed", value: "022", icon: ShieldCheck },
            { label: "Regressions", value: "002", icon: GitCompareArrows },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.12 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3 sm:p-4"
            >
              <item.icon
                size={15}
                className={
                  index === 2
                    ? "mb-3 text-amber-500"
                    : "mb-3 text-emerald-500"
                }
              />
              <p className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">
                {item.value}
              </p>
              <p className="mt-1 text-[10px] text-[var(--muted)] sm:text-xs">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Request timeline</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Example execution trace
              </p>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-500">
              <CircleDot size={12} />
              TRACE VIEW
            </div>
          </div>

          <div className="space-y-2">
            {traces.map((trace, index) => (
              <motion.div
                key={trace.path}
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.12 }}
                className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-3 sm:grid-cols-[52px_minmax(0,1fr)_auto_auto] sm:gap-3"
              >
                <span
                  className={`font-mono text-[10px] font-bold ${
                    trace.method === "POST"
                      ? "text-sky-500"
                      : trace.method === "PATCH"
                        ? "text-amber-500"
                        : "text-emerald-500"
                  }`}
                >
                  {trace.method}
                </span>
                <span className="truncate font-mono text-[10px] text-[var(--foreground)] sm:text-xs">
                  {trace.path}
                </span>
                <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-[10px] text-emerald-500">
                  {trace.status}
                </span>
                <span className="hidden font-mono text-[10px] text-[var(--muted)] sm:block">
                  {trace.time}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
            <span className="text-[10px] text-[var(--muted)]">
              Illustrative data · not a live backend run
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-500">
              <Check size={13} />
              Inspect. Compare. Improve.
            </span>
          </div>
        </div>
      </div>

      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -7, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl sm:flex md:-left-8"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <GitCompareArrows size={17} />
        </div>
        <div>
          <p className="text-xs font-semibold">Regression detected</p>
          <p className="mt-1 text-[10px] text-[var(--muted)]">
            Example: response changed
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-black shadow-lg shadow-emerald-500/20">
              <Activity size={20} strokeWidth={2.5} />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Trace<span className="text-emerald-500">IQ</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[var(--muted)] md:flex">
            <a className="transition hover:text-emerald-500" href="#features">
              Platform
            </a>
            <a className="transition hover:text-emerald-500" href="#workflow">
              Workflow
            </a>
            <a className="transition hover:text-emerald-500" href="#why-traceiq">
              Why TraceIQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeButton />
            <Link
              href="/signup"
              className="group flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#03130c] transition hover:-translate-y-0.5 hover:bg-emerald-400 sm:px-5"
            >Sign in</Link>
          </div>
        </div>
      </header>

      <section className="relative isolate">
        <div className="grid-glow pointer-events-none absolute inset-x-0 top-0 -z-20 h-[780px] opacity-50" />
        <div className="ambient-glow pointer-events-none absolute -top-32 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 opacity-80" />

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-20 sm:px-8 sm:pt-28 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:pb-32 lg:pt-28">
          <div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-2 text-xs text-emerald-600 dark:text-emerald-300"
            >
              <Sparkles size={14} />
              <span>API quality, with a clearer signal</span>
              <ChevronRight size={13} />
            </motion.div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08 }}
              className="max-w-2xl text-5xl leading-[1.06] font-semibold tracking-[-0.065em] sm:text-6xl lg:text-7xl xl:text-[82px]"
            >
              Your APIs change.
              <span className="mt-2 block bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 bg-clip-text pb-2 text-transparent">
                Know what breaks.
              </span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18 }}
              className="mt-7 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg"
            >
              TraceIQ brings API testing, execution history, and regression
              comparison into one developer workspace--so changes become
              visible before they become surprises.
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.28 }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <Link
                href="/signup"
                className="group flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-[#03130c] shadow-lg shadow-emerald-500/15 transition hover:-translate-y-1 hover:bg-emerald-400 hover:shadow-emerald-500/25"
              >Sign in</Link>
              <a
                href="#workflow"
                className="flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-medium transition hover:border-emerald-500/40 hover:bg-emerald-500/5"
              >
                Explore the workflow
                <ArrowDownRight size={16} />
              </a>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="mt-12 flex flex-wrap gap-x-6 gap-y-3 text-xs text-[var(--muted)]"
            >
              <span className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500" />
                OpenAPI-based workflows
              </span>
              <span className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500" />
                Test-run comparisons
              </span>
              <span className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500" />
                Developer-focused insights
              </span>
            </motion.div>
          </div>

          <TracePreview />
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 sm:px-8 md:grid-cols-4 md:gap-8">
          {[
            { value: "01", label: "Unified workspace" },
            { value: "02", label: "Repeatable test runs" },
            { value: "03", label: "Comparable results" },
            { value: "04", label: "Visible regressions" },
          ].map((item) => (
            <div key={item.value} className="flex items-center gap-3">
              <span className="font-mono text-sm text-emerald-500">
                {item.value}
              </span>
              <span className="text-xs text-[var(--muted)] sm:text-sm">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <div className="max-w-2xl">
            <p className="mb-4 font-mono text-xs tracking-[0.24em] text-emerald-500 uppercase">
              Built around the change
            </p>
            <h2 className="text-3xl leading-tight font-semibold tracking-[-0.045em] sm:text-5xl">
              Testing is a step.
              <span className="block text-[var(--muted)]">
                Understanding is the point.
              </span>
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">
              Move from defining what to test to understanding how your API
              behaves across runs.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.number} delay={index * 0.12}>
              <motion.article
                whileHover={reduceMotion ? undefined : { y: -7 }}
                transition={{ duration: 0.25 }}
                className="group relative h-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7"
              >
                <div className="ambient-glow pointer-events-none absolute -right-20 -top-20 h-48 w-48 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                    <feature.icon size={22} />
                  </div>
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {feature.number}
                  </span>
                </div>
                <h3 className="relative mt-8 text-xl font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="relative mt-3 min-h-20 text-sm leading-7 text-[var(--muted)]">
                  {feature.description}
                </p>
                <div className="relative mt-7 flex items-center justify-between border-t border-[var(--border)] pt-5">
                  <span className="font-mono text-[10px] tracking-wider text-emerald-500">
                    {feature.tag}
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="text-[var(--muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-500"
                  />
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="workflow" className="relative border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="grid-glow pointer-events-none absolute inset-0 opacity-20" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-32">
          <Reveal>
            <p className="mb-4 font-mono text-xs tracking-[0.24em] text-emerald-500 uppercase">
              A more useful feedback loop
            </p>
            <h2 className="text-3xl leading-tight font-semibold tracking-[-0.045em] sm:text-5xl">
              From API definition
              <span className="block text-[var(--muted)]">
                to a clearer signal.
              </span>
            </h2>
            <p className="mt-6 max-w-lg leading-7 text-[var(--muted)]">
              Keep the workflow focused: bring in your API, run your checks,
              then compare results to spot what changed.
            </p>
            <Link
              href="/signup"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-500"
            >Sign in</Link>
          </Reveal>

          <div className="space-y-3">
            {[
              {
                icon: Layers3,
                step: "01",
                title: "Define the surface",
                text: "Import your API specification and organize endpoints.",
              },
              {
                icon: Play,
                step: "02",
                title: "Run the checks",
                text: "Execute test cases and inspect their results.",
              },
              {
                icon: GitCompareArrows,
                step: "03",
                title: "Compare the outcomes",
                text: "Review previous runs and investigate regressions.",
              },
            ].map((item, index) => (
              <Reveal key={item.step} delay={index * 0.1}>
                <motion.div
                  whileHover={reduceMotion ? undefined : { x: 5 }}
                  className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 sm:p-6"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <item.icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-emerald-500">
                        STEP {item.step}
                      </span>
                      <h3 className="text-sm font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-sm leading-6 text-[var(--muted)]">
                      {item.text}
                    </p>
                  </div>
                  <ChevronRight size={17} className="mt-1 shrink-0 text-[var(--muted)]" />
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="why-traceiq" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/[0.045] px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
            <div className="ambient-glow pointer-events-none absolute -right-32 -top-32 h-96 w-96 opacity-80" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-2xl">
                <div className="mb-5 flex items-center gap-2 text-xs font-medium tracking-widest text-emerald-500 uppercase">
                  <Radio size={15} />
                  Make every change count
                </div>
                <h2 className="text-3xl leading-tight font-semibold tracking-[-0.045em] sm:text-5xl">
                  Ship changes.
                  <span className="block text-emerald-500">
                    Keep the signal.
                  </span>
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">
                  Give your API workflow a home where execution results and
                  regressions are easier to inspect.
                </p>
              </div>
              <Link
                href="/signup"
                className="group inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-[#03130c] transition hover:-translate-y-1 hover:bg-emerald-400"
              >Sign in</Link>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex w-fit items-center gap-2 text-sm font-semibold">
            <Activity size={17} className="text-emerald-500" />
            TraceIQ
          </Link>
          <p className="text-xs text-[var(--muted)]">
            API testing, execution history, and regression visibility.
          </p>
          <Link
            href="/signup"
            className="flex w-fit items-center gap-1.5 text-xs text-[var(--muted)] transition hover:text-emerald-500"
          >Sign in</Link>
        </div>
      </footer>
    </main>
  );
}


