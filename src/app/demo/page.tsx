import type { Metadata } from "next";

import { DashboardExperience } from "@/features/dashboard/dashboard-experience";
import { getDemoCopy } from "@/features/demo/demo-copy";
import { getDemoDashboardData } from "@/features/demo/demo-data";
import { getLocale } from "@/features/preferences/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getDemoCopy(locale);
  return {
    title: `${copy.dashboard} · SignalBoard demo`,
    description: copy.dashboardIntro,
  };
}

export default async function DemoDashboardPage() {
  const locale = await getLocale();
  const copy = getDemoCopy(locale);
  return (
    <DashboardExperience
      data={getDemoDashboardData()}
      heading={copy.dashboardTitle}
      intro={copy.dashboardIntro}
      projectBasePath="/demo/projects"
    />
  );
}
