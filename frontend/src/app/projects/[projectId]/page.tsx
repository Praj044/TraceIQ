
import { Suspense } from "react";
import ProjectDetailsClient from "./project-details-client";

export default function ProjectDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-8 text-slate-300">
          Loading project details...
        </main>
      }
    >
      <ProjectDetailsClient />
    </Suspense>
  );
}
