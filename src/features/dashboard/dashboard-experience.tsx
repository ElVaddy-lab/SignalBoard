"use client";

import { AlertCircle, ArrowRight, ClipboardList, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Project, ProjectActivity, ProjectStatus } from "@/data/projects";
import { activityMessageKey } from "@/features/activity/contracts";
import type { AppLocale } from "@/i18n/config";

import { formatDate, formatDateTime } from "../projects/project-presentation";
import { Priority, Status } from "../projects/projects-list";
import { getDeadlineState } from "./contracts";
import type { DashboardData } from "./server";
import styles from "./dashboard.module.css";
import statusStyles from "./status-overview.module.css";

type DashboardExperienceProps = { data: DashboardData; forceState?: "loading" | "error" };

export function DashboardExperience({ data, forceState }: DashboardExperienceProps) {
  const [retrying, setRetrying] = useState(false);
  if (forceState === "loading") return <DashboardSkeleton />;
  if (forceState === "error") return <DashboardError onRetry={() => { setRetrying(true); setTimeout(() => setRetrying(false), 400); }} retrying={retrying} />;
  if (!data.metrics.total) return <DashboardEmpty />;
  return <DashboardPopulated data={data} />;
}

function DashboardPopulated({ data }: { data: DashboardData }) {
  const { activity, metrics, recentProjects, statusDistribution, trend, upcoming } = data;
  const t = useTranslations("dashboard");
  return <div className={styles.dashboard}>
    <header className={styles.dashboardIntro}><div><h1>{t("greeting")}</h1><p>{t("intro")}</p></div></header>
    <section aria-label={t("metrics")} className={styles.metricsGrid}>
      <Metric detail={t("currentProjects")} label={t("totalProjects")} value={metrics.total} />
      <Metric detail={t("inProgressNow")} label={t("activeProjects")} value={metrics.active} />
      <Metric detail={t("completedProjects")} label={t("completionRate")} value={metrics.completionRate === null ? "\u2014" : `${metrics.completionRate}%`} />
      <Metric detail={t("needAttention")} label={t("overdueProjects")} tone="danger" value={metrics.overdue} />
      <Metric detail={metrics.lateCompletionRate === null ? t("noDeadlineData") : t("completedWithDeadline", { value: metrics.lateCompletionRate })} label={t("lateCompletions")} value={metrics.lateCompletions} />
    </section>
    <div className={styles.dashboardColumns}>
      <div className={styles.dashboardPrimary}><CompletionTrend trend={trend} /><RecentProjects projects={recentProjects} /><RecentActivity activity={activity} /></div>
      <div className={styles.dashboardSecondary}><StatusOverview distribution={statusDistribution} total={metrics.total} /><UpcomingDeadlines projects={upcoming} /></div>
    </div>
  </div>;
}

function Metric({ detail, label, tone, value }: { detail: string; label: string; tone?: "danger"; value: string | number }) { return <article className={`${styles.metric} ${tone === "danger" ? styles.dangerMetric : ""}`}><span>{label}</span><b>{value}</b><small>{detail}</small></article>; }

function CompletionTrend({ trend }: { trend: DashboardData["trend"] }) {
  const t = useTranslations("dashboard");
  const locale = useLocale() as AppLocale;
  const chartData = trend.map(({ count, weekStart }) => ({ count, week: formatWeek(weekStart, locale), weekStart }));
  return <Panel className={styles.trendPanel}><header><h2>{t("completionTrend")}</h2><span>{t("last12Weeks")}</span></header><div aria-label={t("completionTrendData")} className={styles.trendChart} role="img"><ResponsiveContainer debounce={100} height="100%" initialDimension={{ width: 360, height: 190 }} width="100%"><AreaChart data={chartData} margin={{ top: 12, right: 8, bottom: 0, left: -24 }}><defs><linearGradient id="completion-trend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0F5962" stopOpacity={0.3} /><stop offset="100%" stopColor="#0F5962" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#c9bfaf" strokeDasharray="2 4" vertical={false} /><XAxis axisLine={false} dataKey="week" interval="preserveStartEnd" minTickGap={20} tick={{ fill: "#6e6a63", fontSize: 10 }} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tick={{ fill: "#6e6a63", fontSize: 10 }} tickLine={false} width={26} /><Tooltip contentStyle={{ background: "#fbf9f4", border: "1px solid #dcd4c7", borderRadius: 6, color: "#20201e" }} cursor={{ stroke: "#c94a2c", strokeDasharray: "3 3" }} formatter={(value) => [value, t("completions")]} isAnimationActive={false} /><Area dataKey="count" fill="url(#completion-trend-fill)" isAnimationActive={false} name={t("completions")} stroke="#0F5962" strokeWidth={2.5} type="monotone" /></AreaChart></ResponsiveContainer></div><div aria-label={t("completionTrendData")} className={styles.trendTable}><span>{t("week")}</span>{chartData.map(({ week, weekStart }) => <span key={weekStart}>{week}</span>)}<span>{t("completions")}</span>{chartData.map(({ count, weekStart }) => <span key={`count-${weekStart}`}>{count}</span>)}</div><table className="sr-only"><caption>{t("completionTrendData")}</caption><thead><tr><th scope="col">{t("week")}</th><th scope="col">{t("completions")}</th></tr></thead><tbody>{chartData.map(({ count, week, weekStart }) => <tr key={weekStart}><th scope="row">{week}</th><td>{count}</td></tr>)}</tbody></table></Panel>;
}

const statusOrder: ProjectStatus[] = ["Planning", "Active", "Review", "Completed"];
function StatusOverview({ distribution, total }: { distribution: DashboardData["statusDistribution"]; total: number }) {
  const t = useTranslations("dashboard");
  const projects = useTranslations("projects");
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | null>(null);
  const values = statusOrder.map((status) => ({ status, count: distribution.find((item) => item.status === status)?.count ?? 0, name: projects(`statusValues.${status}`) }));
  const colors: Record<ProjectStatus, string> = { Planning: "#0F5962", Active: "#287C7D", Review: "#CF9113", Completed: "#4F8A50" };
  const items = values.map(({ status, count }) => t("statusCount", { status: projects(`statusValues.${status}`), count })).join(", ");
  const activeDatum = values.find(({ status }) => status === activeStatus);
  const showStatus = (status: ProjectStatus) => setActiveStatus(status);
  const clearStatus = () => setActiveStatus(null);
  return <Panel className={styles.statusPanel}><h2>{t("statusOverview")}</h2><div className={`${styles.statusContent} ${statusStyles.content}`}><div className={statusStyles.chartRow}><div aria-label={t("statusSummary", { total, items })} className={`${styles.donut} ${statusStyles.donut}`} role="img"><ResponsiveContainer debounce={100} height="100%" initialDimension={{ width: 150, height: 150 }} width="100%"><PieChart><Pie data={values} dataKey="count" innerRadius="61%" isAnimationActive={false} onMouseEnter={(_, index) => showStatus(values[index].status)} onMouseLeave={clearStatus} outerRadius="88%" paddingAngle={2} stroke="none">{values.map(({ status }) => <Cell fill={colors[status]} key={status} />)}</Pie></PieChart></ResponsiveContainer><span className={`${styles.donutCenter} ${statusStyles.center}`}><b>{total}</b><small>{t("total")}</small></span></div><div aria-live="polite" className={statusStyles.tooltipRegion}>{activeDatum ? <div className={styles.statusTooltip}>{t("statusTooltip", { status: activeDatum.name, count: activeDatum.count, percentage: total ? Math.round(activeDatum.count / total * 100) : 0 })}</div> : <span>{t("statusTooltipHint")}</span>}</div></div><ul>{values.map(({ status, count }) => <li key={status}><button onBlur={clearStatus} onFocus={() => showStatus(status)} onMouseEnter={() => showStatus(status)} onMouseLeave={clearStatus} type="button"><Status value={status} /><b>{count} <small>{total ? Math.round(count / total * 100) : 0}%</small></b></button></li>)}</ul></div><table className="sr-only"><caption>{t("statusDistribution")}</caption><thead><tr><th scope="col">{projects("status")}</th><th scope="col">{t("total")}</th></tr></thead><tbody>{values.map(({ status, count }) => <tr key={status}><th scope="row">{projects(`statusValues.${status}`)}</th><td>{count}</td></tr>)}</tbody></table></Panel>;
}

function formatWeek(weekStart: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${weekStart}T00:00:00Z`));
}

function UpcomingDeadlines({ projects }: { projects: Project[] }) {
  const t = useTranslations("dashboard");
  const labels = useTranslations("projects");
  const locale = useLocale() as AppLocale;
  return <Panel className={styles.deadlinesPanel}><header><h2>{t("upcomingDeadlines")}</h2><Link href="/projects?deadline=upcoming">{t("viewAll")}</Link></header>{projects.length ? <ul>{projects.map((project) => <li key={project.id}><span className={getDeadlineState(project.deadline, project.status) === "overdue" ? styles.deadlineDotOverdue : styles.deadlineDot} aria-hidden="true" /><Link href={`/projects/${project.id}`}>{project.title}</Link><time>{formatDate(project.deadline, locale, labels("noDeadline"))}</time><b className={getDeadlineState(project.deadline, project.status) === "overdue" ? styles.overdue : undefined}>{getDeadlineState(project.deadline, project.status) === "overdue" ? labels("overdue") : labels("upcoming")}</b></li>)}</ul> : <p className={styles.panelEmpty}>{t("noUpcomingDeadlines")}</p>}</Panel>;
}

function RecentProjects({ projects }: { projects: Project[] }) {
  const t = useTranslations("dashboard");
  const labels = useTranslations("projects");
  const locale = useLocale() as AppLocale;
  return <Panel className={styles.recentProjects}><header><h2>{t("recentProjects")}</h2><Link href="/projects">{t("viewAll")}</Link></header><div className={styles.recentTable}><div className={styles.recentTableHead}><span>{labels("project")}</span><span>{labels("status")}</span><span>{labels("priority")}</span><span>{labels("projectLead")}</span><span>{labels("completion")}</span><span>{labels("deadline")}</span></div>{projects.map((project) => <div className={styles.recentRow} key={project.id}><Link href={`/projects/${project.id}`}>{project.title}</Link><Status value={project.status} /><Priority value={project.priority} /><span>{project.projectLead}</span><div className={styles.recentProgress}><span>{project.completion}%</span><ProgressBar value={project.completion} /></div><span className={getDeadlineState(project.deadline, project.status) === "overdue" ? styles.overdue : undefined}>{formatDate(project.deadline, locale, labels("noDeadline"))}</span></div>)}</div></Panel>;
}

function RecentActivity({ activity }: { activity: ProjectActivity[] }) {
  const t = useTranslations("dashboard");
  const activityT = useTranslations("activity");
  const locale = useLocale() as AppLocale;
  return <Panel className={`${styles.recentActivity} ${styles.dashboardActivity}`}><h2>{t("recentActivity")}</h2><ol>{activity.map((item) => <li key={item.id}><span className={styles.activitySymbol}>{item.type === "created" ? "+" : item.type === "deleted" ? "\u2212" : "\u2197"}</span><div><b>{activityT(activityMessageKey(item))}</b><small>{item.projectId ? <Link href={`/projects/${item.projectId}`}>{item.projectTitle}</Link> : item.projectTitle}</small></div><time>{formatDateTime(item.occurredAt, locale)}</time></li>)}</ol></Panel>;
}

export function DashboardEmpty() {
  const t = useTranslations("dashboard");
  const projects = useTranslations("projects");
  return <div className={styles.dashboard}><header className={styles.dashboardIntro}><div><h1>{t("greeting")}</h1><p>{t("intro")}</p></div></header><section className={styles.emptyDashboard}><ClipboardList aria-hidden="true" size={70} /><h2>{t("startTracking")}</h2><p>{t("emptyDescription")}</p><div><Link className={styles.createLink} href="/projects?new=1">{projects("createProject")}</Link></div><ol><li><b>1</b><span><strong>{t("stepCreateTitle")}</strong>{t("stepCreateDescription")}</span></li><li><b>2</b><span><strong>{t("stepTrackTitle")}</strong>{t("stepTrackDescription")}</span></li><li><b>3</b><span><strong>{t("stepReviewTitle")}</strong>{t("stepReviewDescription")}</span></li></ol></section></div>;
}

export function DashboardSkeleton() { const t = useTranslations("dashboard"); return <div aria-busy="true" aria-label={t("loading")} className={`${styles.dashboard} ${styles.dashboardSkeleton}`}><div className={styles.skeletonIntro} /><div className={styles.metricsGrid}>{Array.from({ length: 5 }, (_, index) => <div className={styles.skeletonMetric} key={index} />)}</div><div className={styles.dashboardColumns}><div className={styles.dashboardPrimary}><div className={`${styles.skeletonPanel} ${styles.skeletonTrend}`} /><div className={`${styles.skeletonPanel} ${styles.skeletonRecentProjects}`} /><div className={`${styles.skeletonPanel} ${styles.skeletonActivity}`} /></div><div className={styles.dashboardSecondary}><div className={`${styles.skeletonPanel} ${styles.skeletonStatus}`} /><div className={`${styles.skeletonPanel} ${styles.skeletonDeadlines}`} /></div></div></div>; }

export function DashboardError({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) { const t = useTranslations("dashboard"); const projects = useTranslations("projects"); return <div className={styles.dashboard}><section className={styles.dashboardError}><AlertCircle aria-hidden="true" size={60} /><div><h1>{t("loadErrorTitle")}</h1><p>{t("loadErrorDescription")}</p><div><Button loading={retrying} onClick={onRetry}><RefreshCw aria-hidden="true" size={18} />{t("tryAgain")}</Button><Link href="/projects">{projects("title")} <ArrowRight aria-hidden="true" size={17} /></Link></div><small>{t("loadErrorHint")}</small></div></section></div>; }
