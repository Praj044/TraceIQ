"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/app/lib/api";

type AuthGuardProps = {
  children: ReactNode;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        await apiGet<CurrentUser>("/api/v1/auth/me");

        if (!cancelled) {
          setAuthenticated(true);
        }
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking || !authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">
          Checking your session...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
