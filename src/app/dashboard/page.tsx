import { Suspense } from "react";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 p-8 text-white">
          Loading dashboard...
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}