"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

import { Status } from "@/features/projects/project-badges";

import type {
  CompletionTrendDatum,
  StatusOverviewDatum,
} from "./dashboard-chart-islands";
import styles from "./dashboard.module.css";
import statusStyles from "./status-overview.module.css";

export function CompletionTrendChart({
  ariaLabel,
  completionsLabel,
  data,
}: {
  ariaLabel: string;
  completionsLabel: string;
  data: CompletionTrendDatum[];
}) {
  return (
    <div aria-label={ariaLabel} className={styles.trendChart} role="img">
      <ResponsiveContainer
        debounce={100}
        height="100%"
        initialDimension={{ width: 360, height: 190 }}
        width="100%"
      >
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="completion-trend-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0F5962" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0F5962" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#c9bfaf" strokeDasharray="2 4" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="week"
            interval="preserveStartEnd"
            minTickGap={20}
            tick={{ fill: "#6e6a63", fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tick={{ fill: "#6e6a63", fontSize: 10 }}
            tickLine={false}
            width={26}
          />
          <Tooltip
            contentStyle={{
              background: "#fbf9f4",
              border: "1px solid #dcd4c7",
              borderRadius: 6,
              color: "#20201e",
            }}
            cursor={{ stroke: "#c94a2c", strokeDasharray: "3 3" }}
            formatter={(value) => [value, completionsLabel]}
            isAnimationActive={false}
          />
          <Area
            dataKey="count"
            fill="url(#completion-trend-fill)"
            isAnimationActive={false}
            name={completionsLabel}
            stroke="#0F5962"
            strokeWidth={2.5}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const colors: Record<StatusOverviewDatum["status"], string> = {
  Planning: "#0F5962",
  Active: "#287C7D",
  Review: "#CF9113",
  Completed: "#4F8A50",
};

export function StatusOverviewChart({
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
  const [activeStatus, setActiveStatus] = useState<
    StatusOverviewDatum["status"] | null
  >(null);
  const activeDatum = values.find(({ status }) => status === activeStatus);
  const clearStatus = () => setActiveStatus(null);

  return (
    <div className={`${styles.statusContent} ${statusStyles.content}`}>
      <div className={statusStyles.chartRow}>
        <div
          aria-label={ariaLabel}
          className={`${styles.donut} ${statusStyles.donut}`}
          role="img"
        >
          <ResponsiveContainer
            debounce={100}
            height="100%"
            initialDimension={{ width: 150, height: 150 }}
            width="100%"
          >
            <PieChart>
              <Pie
                data={values}
                dataKey="count"
                innerRadius="61%"
                isAnimationActive={false}
                onMouseEnter={(_, index) => setActiveStatus(values[index].status)}
                onMouseLeave={clearStatus}
                outerRadius="88%"
                paddingAngle={2}
                stroke="none"
              >
                {values.map(({ status }) => (
                  <Cell fill={colors[status]} key={status} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <span className={`${styles.donutCenter} ${statusStyles.center}`}>
            <b>{total}</b>
            <small>{totalLabel}</small>
          </span>
        </div>
        <div aria-live="polite" className={statusStyles.tooltipRegion}>
          {activeDatum ? (
            <div className={styles.statusTooltip}>{activeDatum.tooltip}</div>
          ) : (
            <span>{hint}</span>
          )}
        </div>
      </div>
      <ul>
        {values.map(({ status, count }) => (
          <li key={status}>
            <button
              onBlur={clearStatus}
              onFocus={() => setActiveStatus(status)}
              onMouseEnter={() => setActiveStatus(status)}
              onMouseLeave={clearStatus}
              type="button"
            >
              <Status label={values.find((item) => item.status === status)?.name} value={status} />
              <b>
                {count} <small>{total ? Math.round((count / total) * 100) : 0}%</small>
              </b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
