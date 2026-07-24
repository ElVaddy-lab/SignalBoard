"use client";

import dynamic from "next/dynamic";

import type { ProjectStatus } from "@/data/projects";

import styles from "./dashboard.module.css";

export type CompletionTrendDatum = {
  count: number;
  week: string;
  weekStart: string;
};

export type StatusOverviewDatum = {
  status: ProjectStatus;
  count: number;
  name: string;
  tooltip: string;
};

const CompletionTrendChart = dynamic(
  () =>
    import("./dashboard-charts").then((module) => module.CompletionTrendChart),
  {
    loading: () => <div aria-hidden="true" className={styles.trendChartPlaceholder} />,
    ssr: false,
  },
);

const StatusOverviewChart = dynamic(
  () => import("./dashboard-charts").then((module) => module.StatusOverviewChart),
  {
    loading: () => <div aria-hidden="true" className={styles.statusChartPlaceholder} />,
    ssr: false,
  },
);

export function CompletionTrendChartIsland({
  ariaLabel,
  completionsLabel,
  data,
}: {
  ariaLabel: string;
  completionsLabel: string;
  data: CompletionTrendDatum[];
}) {
  return (
    <div className={styles.trendIslandSlot}>
      <CompletionTrendChart
        ariaLabel={ariaLabel}
        completionsLabel={completionsLabel}
        data={data}
      />
    </div>
  );
}

export function StatusOverviewChartIsland({
  ariaLabel,
  hint,
  total,
  totalLabel,
  values,
}: {
  ariaLabel: string;
  hint: string;
  total: number;
  totalLabel: string;
  values: StatusOverviewDatum[];
}) {
  return (
    <div className={styles.statusIslandSlot}>
      <StatusOverviewChart
        ariaLabel={ariaLabel}
        hint={hint}
        total={total}
        totalLabel={totalLabel}
        values={values}
      />
    </div>
  );
}
