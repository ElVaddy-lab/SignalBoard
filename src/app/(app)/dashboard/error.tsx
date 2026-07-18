"use client";

import { DashboardError } from "@/features/dashboard/dashboard-experience";

export default function DashboardRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <DashboardError onRetry={reset} />;
}
