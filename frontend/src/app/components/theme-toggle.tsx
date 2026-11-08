
"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Choose appearance"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)]"
      >
        <Sun size={18} />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--border)] bg-(--surface)] text-(--foreground)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
