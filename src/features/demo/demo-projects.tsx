import Link from "next/link";
import { createTranslator } from "next-intl";

import { ProgressBar } from "@/components/ui/progress-bar";
import type { Project } from "@/data/projects";
import { getDeadlineState } from "@/features/dashboard/contracts";
import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

import { getDemoCopy } from "./demo-copy";
import type { listDemoProjects } from "./demo-data";
import styles from "./demo.module.css";

type DemoList = ReturnType<typeof listDemoProjects>;

function queryHref(
  searchParams: Record<string, string | string[] | undefined>,
  page: number,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : value ? [value] : []) {
      if (key !== "page" && item) params.append(key, item);
    }
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/demo/projects?${query}` : "/demo/projects";
}

export function DemoProjectsDirectory({
  data,
  locale,
  messages,
  params,
  searchParams,
}: {
  data: DemoList;
  locale: AppLocale;
  messages: Messages;
  params: {
    q: string;
    status: Project["status"][];
    priority: Project["priority"][];
    deadline: string;
    sort: string;
  };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const copy = getDemoCopy(locale);
  const t = createTranslator({ locale, messages, namespace: "projects" });

  return (
    <section className={styles.directory}>
      <header className={styles.directoryIntro}>
        <div>
          <h1>{copy.directoryTitle}</h1>
          <p>{copy.directoryIntro}</p>
        </div>
        <strong>{t("projectCount", { count: data.totalCount })}</strong>
      </header>
      <form action="/demo/projects" className={styles.filters} method="get">
        <label>
          {t("search")}
          <input defaultValue={params.q} name="q" placeholder={t("searchPlaceholder")} type="search" />
        </label>
        <label>
          {t("status")}
          <select defaultValue={params.status[0] ?? ""} name="status">
            <option value="">{copy.anyStatus}</option>
            {(["Planning", "Active", "Review", "Completed"] as const).map((value) => (
              <option key={value} value={value}>{t(`statusValues.${value}`)}</option>
            ))}
          </select>
        </label>
        <label>
          {t("priority")}
          <select defaultValue={params.priority[0] ?? ""} name="priority">
            <option value="">{copy.anyPriority}</option>
            {(["Low", "Medium", "High"] as const).map((value) => (
              <option key={value} value={value}>{t(`priorityValues.${value}`)}</option>
            ))}
          </select>
        </label>
        <label>
          {t("deadline")}
          <select defaultValue={params.deadline} name="deadline">
            <option value="any">{t("allDeadlines")}</option>
            <option value="upcoming">{t("upcoming")}</option>
            <option value="overdue">{t("overdue")}</option>
            <option value="none">{t("noDeadline")}</option>
          </select>
        </label>
        <label>
          {copy.sortBy}
          <select defaultValue={params.sort} name="sort">
            <option value="updated-desc">{t("recentlyUpdated")}</option>
            <option value="created-desc">{t("recentlyCreated")}</option>
            <option value="deadline-asc">{t("deadlineSort")}</option>
            <option value="title-asc">{t("titleSort")}</option>
            <option value="priority-desc">{t("prioritySort")}</option>
          </select>
        </label>
        <button type="submit">{copy.applyFilters}</button>
      </form>
      {data.projects.length ? (
        <>
          <div className={styles.projectGrid}>
            {data.projects.map((project) => (
              <DemoProjectCard key={project.id} locale={locale} messages={messages} project={project} />
            ))}
          </div>
          {data.totalPages > 1 ? (
            <nav aria-label={t("pagination")} className={styles.pagination}>
              {Array.from({ length: data.totalPages }, (_, index) => index + 1).map((page) =>
                page === data.page ? (
                  <span aria-current="page" key={page}>{page}</span>
                ) : (
                  <Link href={queryHref(searchParams, page)} key={page}>{page}</Link>
                ),
              )}
            </nav>
          ) : null}
        </>
      ) : (
        <div className={styles.empty}>
          <h2>{copy.noResultsTitle}</h2>
          <p>{copy.noResultsBody}</p>
          <Link href="/demo/projects">{t("clearFilters")}</Link>
        </div>
      )}
    </section>
  );
}

function DemoProjectCard({
  locale,
  messages,
  project,
}: {
  locale: AppLocale;
  messages: Messages;
  project: Project;
}) {
  const t = createTranslator({ locale, messages, namespace: "projects" });
  const deadlineState = getDeadlineState(project.deadline, project.status);
  const deadline = project.deadline
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date(`${project.deadline}T00:00:00Z`),
      )
    : t("noDeadline");

  return (
    <article className={styles.projectCard}>
      <header>
        <div>
          <h2><Link href={`/demo/projects/${project.id}`}>{project.title}</Link></h2>
          <p>{project.description}</p>
        </div>
        <strong>{t(`statusValues.${project.status}`)}</strong>
      </header>
      <ProgressBar value={project.completion} />
      <dl className={styles.projectMeta}>
        <div><dt>{t("priority")}</dt><dd>{t(`priorityValues.${project.priority}`)}</dd></div>
        <div><dt>{t("projectLead")}</dt><dd>{project.projectLead}</dd></div>
        <div><dt>{t("completion")}</dt><dd>{project.completion}%</dd></div>
        <div><dt>{t("deadline")}</dt><dd>{deadline}</dd></div>
        <div><dt>{t("filterByDeadline")}</dt><dd>{t(deadlineState === "none" ? "noDeadline" : deadlineState)}</dd></div>
      </dl>
    </article>
  );
}
