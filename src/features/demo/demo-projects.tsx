import Link from "next/link";
import { createTranslator } from "next-intl";

import type { Project } from "@/data/projects";
import {
  ProjectsListPresentation,
  type ProjectDeadlineLabels,
  type ProjectsListLabels,
} from "@/features/projects/projects-list-presentation";
import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

import { getDemoCopy } from "./demo-copy";
import type { listDemoProjects } from "./demo-data";
import styles from "./demo.module.css";

type DemoList = ReturnType<typeof listDemoProjects>;

function queryHref(
  searchParams: Record<string, string | string[] | undefined>,
  page: number,
  basePath = "/demo/projects",
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : value ? [value] : []) {
      if (key !== "page" && item) params.append(key, item);
    }
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
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
  const deadlineLabels: ProjectDeadlineLabels = {
    none: t("noDeadline"),
    overdue: t("overdue"),
    upcoming: t("upcoming"),
    completed: t("completed"),
    scheduled: t("scheduled"),
  };
  const labels: ProjectsListLabels = {
    actions: t("actions"),
    completion: t("completion"),
    completionPercent: (value) => t("completionPercent", { value }),
    deadline: t("deadline"),
    matchingCaption: t("matchingCaption"),
    priority: t("priority"),
    priorityValues: {
      Low: t("priorityValues.Low"),
      Medium: t("priorityValues.Medium"),
      High: t("priorityValues.High"),
    },
    project: t("project"),
    projectLead: t("projectLead"),
    status: t("status"),
    statusValues: {
      Planning: t("statusValues.Planning"),
      Active: t("statusValues.Active"),
      Review: t("statusValues.Review"),
      Completed: t("statusValues.Completed"),
    },
    updated: t("updated"),
    viewProject: t("viewProject"),
  };

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
          <input
            defaultValue={params.q}
            name="q"
            placeholder={t("searchPlaceholder")}
            type="search"
          />
        </label>
        <label>
          {t("status")}
          <select defaultValue={params.status[0] ?? ""} name="status">
            <option value="">{copy.anyStatus}</option>
            {(["Planning", "Active", "Review", "Completed"] as const).map(
              (value) => (
                <option key={value} value={value}>
                  {t(`statusValues.${value}`)}
                </option>
              ),
            )}
          </select>
        </label>
        <label>
          {t("priority")}
          <select defaultValue={params.priority[0] ?? ""} name="priority">
            <option value="">{copy.anyPriority}</option>
            {(["Low", "Medium", "High"] as const).map((value) => (
              <option key={value} value={value}>
                {t(`priorityValues.${value}`)}
              </option>
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
          <ProjectsListPresentation
            basePath="/demo/projects"
            deadlineLabels={deadlineLabels}
            labels={labels}
            locale={locale}
            projects={data.projects}
          />
          {data.totalPages > 1 ? (
            <nav aria-label={t("pagination")} className={styles.pagination}>
              {Array.from(
                { length: data.totalPages },
                (_, index) => index + 1,
              ).map((page) =>
                page === data.page ? (
                  <span aria-current="page" key={page}>
                    {page}
                  </span>
                ) : (
                  <Link href={queryHref(searchParams, page)} key={page}>
                    {page}
                  </Link>
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
