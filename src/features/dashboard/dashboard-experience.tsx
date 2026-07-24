import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { createTranslator } from "next-intl";

import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Project, ProjectActivity, ProjectStatus } from "@/data/projects";
import { activityMessageKey } from "@/features/activity/contracts";
import { getLocale } from "@/features/preferences/locale";
import { Priority, Status } from "@/features/projects/project-badges";
import { formatDate, formatDateTime } from "@/features/projects/project-presentation";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

import {
  CompletionTrendChartIsland,
  StatusOverviewChartIsland,
} from "./dashboard-chart-islands";
import { getDeadlineState } from "./contracts";
import type { DashboardData } from "./server";
import styles from "./dashboard.module.css";

export async function DashboardExperience({ data }: { data: DashboardData }) {
  if (!data.metrics.total) return <DashboardEmpty />;

  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "dashboard" });
  const projects = createTranslator({ locale, messages, namespace: "projects" });
  const activityT = createTranslator({ locale, messages, namespace: "activity" });
  const { activity, metrics, recentProjects, statusDistribution, trend, upcoming } =
    data;
  const deadlineLabels = {
    noDeadline: projects("noDeadline"),
    overdue: projects("overdue"),
    upcoming: projects("upcoming"),
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardIntro}>
        <div>
          <h1>{t("greeting")}</h1>
          <p>{t("intro")}</p>
        </div>
      </header>
      <section aria-label={t("metrics")} className={styles.metricsGrid} tabIndex={0}>
        <Metric
          detail={t("currentProjects")}
          label={t("totalProjects")}
          value={metrics.total}
        />
        <Metric
          detail={t("inProgressNow")}
          label={t("activeProjects")}
          value={metrics.active}
        />
        <Metric
          detail={t("completedProjects")}
          label={t("completionRate")}
          value={metrics.completionRate === null ? "—" : `${metrics.completionRate}%`}
        />
        <Metric
          detail={t("needAttention")}
          label={t("overdueProjects")}
          tone="danger"
          value={metrics.overdue}
        />
        <Metric
          detail={
            metrics.lateCompletionRate === null
              ? t("noDeadlineData")
              : t("completedWithDeadline", { value: metrics.lateCompletionRate })
          }
          label={t("lateCompletions")}
          value={metrics.lateCompletions}
        />
      </section>
      <div className={styles.dashboardColumns}>
        <div className={styles.dashboardPrimary}>
          <CompletionTrend
            completionsLabel={t("completions")}
            dataLabel={t("completionTrendData")}
            heading={t("completionTrend")}
            locale={locale}
            periodLabel={t("last12Weeks")}
            trend={trend}
            weekLabel={t("week")}
          />
          <RecentProjects
            deadlineLabels={deadlineLabels}
            labels={{
              project: projects("project"),
              status: projects("status"),
              priority: projects("priority"),
              projectLead: projects("projectLead"),
              completion: projects("completion"),
              deadline: projects("deadline"),
            }}
            priorityLabels={{
              Low: projects("priorityValues.Low"),
              Medium: projects("priorityValues.Medium"),
              High: projects("priorityValues.High"),
            }}
            locale={locale}
            projects={recentProjects}
            statusLabels={{
              Planning: projects("statusValues.Planning"),
              Active: projects("statusValues.Active"),
              Review: projects("statusValues.Review"),
              Completed: projects("statusValues.Completed"),
            }}
            title={t("recentProjects")}
            viewAll={t("viewAll")}
          />
          <RecentActivity
            activity={activity}
            locale={locale}
            messages={activity.map((item) => activityT(activityMessageKey(item)))}
            title={t("recentActivity")}
          />
        </div>
        <div className={styles.dashboardSecondary}>
          <StatusOverview
            distribution={statusDistribution}
            heading={t("statusOverview")}
            hint={t("statusTooltipHint")}
            statusLabel={projects("status")}
            total={metrics.total}
            totalLabel={t("total")}
            translatedStatuses={{
              Planning: projects("statusValues.Planning"),
              Active: projects("statusValues.Active"),
              Review: projects("statusValues.Review"),
              Completed: projects("statusValues.Completed"),
            }}
            distributionLabel={t("statusDistribution")}
            summaryLabel={t("statusSummary", {
              total: metrics.total,
              items: statusDistribution
                .map(({ status, count }) =>
                  t("statusCount", {
                    status: projects(`statusValues.${status}`),
                    count,
                  }),
                )
                .join(", "),
            })}
            tooltipLabels={Object.fromEntries(
              statusOrder.map((status) => {
                const count =
                  statusDistribution.find((item) => item.status === status)?.count ?? 0;
                return [
                  status,
                  t("statusTooltip", {
                    status: projects(`statusValues.${status}`),
                    count,
                    percentage: metrics.total
                      ? Math.round((count / metrics.total) * 100)
                      : 0,
                  }),
                ];
              }),
            ) as Record<ProjectStatus, string>}
          />
          <UpcomingDeadlines
            deadlineLabels={deadlineLabels}
            locale={locale}
            projects={upcoming}
            title={t("upcomingDeadlines")}
            viewAll={t("viewAll")}
            emptyLabel={t("noUpcomingDeadlines")}
          />
        </div>
      </div>
    </div>
  );
}

function Metric({
  detail,
  label,
  tone,
  value,
}: {
  detail: string;
  label: string;
  tone?: "danger";
  value: string | number;
}) {
  return (
    <article
      className={`${styles.metric} ${tone === "danger" ? styles.dangerMetric : ""}`}
    >
      <span>{label}</span>
      <b>{value}</b>
      <small>{detail}</small>
    </article>
  );
}

function CompletionTrend({
  completionsLabel,
  dataLabel,
  heading,
  locale,
  periodLabel,
  trend,
  weekLabel,
}: {
  completionsLabel: string;
  dataLabel: string;
  heading: string;
  locale: AppLocale;
  periodLabel: string;
  trend: DashboardData["trend"];
  weekLabel: string;
}) {
  const chartData = trend.map(({ count, weekStart }) => ({
    count,
    week: formatWeek(weekStart, locale),
    weekStart,
  }));

  return (
    <Panel className={styles.trendPanel}>
      <header>
        <h2>{heading}</h2>
        <span>{periodLabel}</span>
      </header>
      <CompletionTrendChartIsland
        ariaLabel={dataLabel}
        completionsLabel={completionsLabel}
        data={chartData}
      />
      <div aria-label={dataLabel} className={styles.trendTable}>
        <span>{weekLabel}</span>
        {chartData.map(({ week, weekStart }) => (
          <span key={weekStart}>{week}</span>
        ))}
        <span>{completionsLabel}</span>
        {chartData.map(({ count, weekStart }) => (
          <span key={`count-${weekStart}`}>{count}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{dataLabel}</caption>
        <thead>
          <tr>
            <th scope="col">{weekLabel}</th>
            <th scope="col">{completionsLabel}</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map(({ count, week, weekStart }) => (
            <tr key={weekStart}>
              <th scope="row">{week}</th>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

const statusOrder: ProjectStatus[] = ["Planning", "Active", "Review", "Completed"];

function StatusOverview({
  distribution,
  distributionLabel,
  heading,
  hint,
  statusLabel,
  summaryLabel,
  total,
  totalLabel,
  translatedStatuses,
  tooltipLabels,
}: {
  distribution: DashboardData["statusDistribution"];
  distributionLabel: string;
  heading: string;
  hint: string;
  statusLabel: string;
  summaryLabel: string;
  total: number;
  totalLabel: string;
  translatedStatuses: Record<ProjectStatus, string>;
  tooltipLabels: Record<ProjectStatus, string>;
}) {
  const values = statusOrder.map((status) => ({
    status,
    count: distribution.find((item) => item.status === status)?.count ?? 0,
    name: translatedStatuses[status],
    tooltip: tooltipLabels[status],
  }));

  return (
    <Panel className={styles.statusPanel}>
      <h2>{heading}</h2>
      <StatusOverviewChartIsland
        ariaLabel={summaryLabel}
        hint={hint}
        total={total}
        totalLabel={totalLabel}
        values={values}
      />
      <table className="sr-only">
        <caption>{distributionLabel}</caption>
        <thead>
          <tr>
            <th scope="col">{statusLabel}</th>
            <th scope="col">{totalLabel}</th>
          </tr>
        </thead>
        <tbody>
          {values.map(({ status, count, name }) => (
            <tr key={status}>
              <th scope="row">{name}</th>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function formatWeek(weekStart: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${weekStart}T00:00:00Z`));
}

function UpcomingDeadlines({
  deadlineLabels,
  emptyLabel,
  locale,
  projects,
  title,
  viewAll,
}: {
  deadlineLabels: { noDeadline: string; overdue: string; upcoming: string };
  emptyLabel: string;
  locale: AppLocale;
  projects: Project[];
  title: string;
  viewAll: string;
}) {
  return (
    <Panel className={styles.deadlinesPanel}>
      <header>
        <h2>{title}</h2>
        <Link href="/projects?deadline=upcoming">{viewAll}</Link>
      </header>
      {projects.length ? (
        <ul>
          {projects.map((project) => {
            const overdue = getDeadlineState(project.deadline, project.status) === "overdue";
            return (
              <li key={project.id}>
                <span
                  aria-hidden="true"
                  className={overdue ? styles.deadlineDotOverdue : styles.deadlineDot}
                />
                <Link href={`/projects/${project.id}`}>{project.title}</Link>
                <time>{formatDate(project.deadline, locale, deadlineLabels.noDeadline)}</time>
                <b className={overdue ? styles.overdue : undefined}>
                  {overdue ? deadlineLabels.overdue : deadlineLabels.upcoming}
                </b>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.panelEmpty}>{emptyLabel}</p>
      )}
    </Panel>
  );
}

function RecentProjects({
  deadlineLabels,
  labels,
  locale,
  priorityLabels,
  projects,
  statusLabels,
  title,
  viewAll,
}: {
  deadlineLabels: { noDeadline: string };
  labels: {
    project: string;
    status: string;
    priority: string;
    projectLead: string;
    completion: string;
    deadline: string;
  };
  locale: AppLocale;
  priorityLabels: Record<Project["priority"], string>;
  projects: Project[];
  statusLabels: Record<Project["status"], string>;
  title: string;
  viewAll: string;
}) {
  return (
    <Panel className={styles.recentProjects}>
      <header>
        <h2>{title}</h2>
        <Link href="/projects">{viewAll}</Link>
      </header>
      <div className={styles.recentTable}>
        <div className={styles.recentTableHead}>
          <span>{labels.project}</span>
          <span>{labels.status}</span>
          <span>{labels.priority}</span>
          <span>{labels.projectLead}</span>
          <span>{labels.completion}</span>
          <span>{labels.deadline}</span>
        </div>
        {projects.map((project) => (
          <div className={styles.recentRow} key={project.id}>
            <Link href={`/projects/${project.id}`}>{project.title}</Link>
            <Status label={statusLabels[project.status]} value={project.status} />
            <Priority label={priorityLabels[project.priority]} value={project.priority} />
            <span>{project.projectLead}</span>
            <div className={styles.recentProgress}>
              <span>{project.completion}%</span>
              <ProgressBar value={project.completion} />
            </div>
            <span
              className={
                getDeadlineState(project.deadline, project.status) === "overdue"
                  ? styles.overdue
                  : undefined
              }
            >
              {formatDate(project.deadline, locale, deadlineLabels.noDeadline)}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RecentActivity({
  activity,
  locale,
  messages,
  title,
}: {
  activity: ProjectActivity[];
  locale: AppLocale;
  messages: string[];
  title: string;
}) {
  return (
    <Panel className={`${styles.recentActivity} ${styles.dashboardActivity}`}>
      <h2>{title}</h2>
      <ol>
        {activity.map((item, index) => (
          <li key={item.id}>
            <span className={styles.activitySymbol}>
              {item.type === "created" ? "+" : item.type === "deleted" ? "−" : "↗"}
            </span>
            <div>
              <b>{messages[index]}</b>
              <small>
                {item.projectId ? (
                  <Link href={`/projects/${item.projectId}`}>{item.projectTitle}</Link>
                ) : (
                  item.projectTitle
                )}
              </small>
            </div>
            <time>{formatDateTime(item.occurredAt, locale)}</time>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export async function DashboardEmpty() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "dashboard" });
  const projects = createTranslator({ locale, messages, namespace: "projects" });
  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardIntro}>
        <div>
          <h1>{t("greeting")}</h1>
          <p>{t("intro")}</p>
        </div>
      </header>
      <section className={styles.emptyDashboard}>
        <ClipboardList aria-hidden="true" size={70} />
        <h2>{t("startTracking")}</h2>
        <p>{t("emptyDescription")}</p>
        <div>
          <Link className={styles.createLink} href="/projects?new=1">
            {projects("createProject")}
          </Link>
        </div>
        <ol>
          <li>
            <b>1</b>
            <span>
              <strong>{t("stepCreateTitle")}</strong>
              {t("stepCreateDescription")}
            </span>
          </li>
          <li>
            <b>2</b>
            <span>
              <strong>{t("stepTrackTitle")}</strong>
              {t("stepTrackDescription")}
            </span>
          </li>
          <li>
            <b>3</b>
            <span>
              <strong>{t("stepReviewTitle")}</strong>
              {t("stepReviewDescription")}
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}

export async function DashboardSkeleton() {
  const locale = await getLocale();
  const t = createTranslator({
    locale,
    messages: getMessages(locale),
    namespace: "dashboard",
  });
  return (
    <div
      aria-busy="true"
      aria-label={t("loading")}
      className={`${styles.dashboard} ${styles.dashboardSkeleton}`}
    >
      <div className={styles.skeletonIntro} />
      <div className={styles.metricsGrid}>
        {Array.from({ length: 5 }, (_, index) => (
          <div className={styles.skeletonMetric} key={index} />
        ))}
      </div>
      <div className={styles.dashboardColumns}>
        <div className={styles.dashboardPrimary}>
          <div className={`${styles.skeletonPanel} ${styles.skeletonTrend}`} />
          <div className={`${styles.skeletonPanel} ${styles.skeletonRecentProjects}`} />
          <div className={`${styles.skeletonPanel} ${styles.skeletonActivity}`} />
        </div>
        <div className={styles.dashboardSecondary}>
          <div className={`${styles.skeletonPanel} ${styles.skeletonStatus}`} />
          <div className={`${styles.skeletonPanel} ${styles.skeletonDeadlines}`} />
        </div>
      </div>
    </div>
  );
}
