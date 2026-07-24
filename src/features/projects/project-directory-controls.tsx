"use client";

import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Project } from "@/data/projects";

import {
  deadlineFilters,
  projectPriorities,
  projectSortOptions,
  projectStatuses,
  type DeadlineFilter,
  type ProjectListParams,
  type ProjectSort,
} from "./project-list-contract";
import styles from "./projects.module.css";

const MobileFilterControl = dynamic(
  () =>
    import("./project-list-overlays").then((module) => module.MobileFilterControl),
  {
    loading: () => <span aria-hidden="true" className={styles.mobileFilterPlaceholder} />,
    ssr: false,
  },
);

const defaultParams: ProjectListParams = {
  q: "",
  status: [],
  priority: [],
  deadline: "any",
  sort: "updated-desc",
  page: 1,
};

function projectsHref(params: ProjectListParams) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status.length) query.set("status", params.status.join(","));
  if (params.priority.length) query.set("priority", params.priority.join(","));
  if (params.deadline !== "any") query.set("deadline", params.deadline);
  if (params.sort !== "updated-desc") query.set("sort", params.sort);
  if (params.page > 1) query.set("page", String(params.page));
  return `/projects${query.size ? `?${query}` : ""}`;
}

export function ProjectDirectoryControls({
  initialParams,
  totalCount,
}: {
  initialParams: ProjectListParams;
  totalCount: number;
}) {
  const router = useRouter();
  const t = useTranslations("projects");
  const [params, setParams] = useState(initialParams);
  const sortLabels: Record<ProjectSort, string> = {
    "updated-desc": t("recentlyUpdated"),
    "created-desc": t("recentlyCreated"),
    "deadline-asc": t("deadlineSort"),
    "title-asc": t("titleSort"),
    "priority-desc": t("prioritySort"),
  };
  const activeFilters =
    params.status.length +
    params.priority.length +
    (params.deadline !== "any" ? 1 : 0);
  const update = (changes: Partial<ProjectListParams>, resetPage = true) => {
    const next = {
      ...params,
      ...changes,
      page: resetPage ? 1 : changes.page ?? params.page,
    };
    setParams(next);
    router.replace(projectsHref(next), { scroll: false });
  };
  const clear = () => {
    setParams(defaultParams);
    router.replace("/projects", { scroll: false });
  };

  return (
    <>
      <section aria-label={t("filterProjects")} className={styles.projectControls}>
        <label className={styles.searchField}>
          <Search aria-hidden="true" size={19} />
          <span className="sr-only">{t("search")}</span>
          <input
            onChange={(event) => update({ q: event.target.value })}
            placeholder={t("searchPlaceholder")}
            value={params.q}
          />
          {params.q ? (
            <button
              aria-label={t("clearSearch")}
              onClick={() => update({ q: "" })}
              type="button"
            >
              <X aria-hidden="true" size={17} />
            </button>
          ) : null}
        </label>
        <div className={styles.desktopFilters}>
          <select
            aria-label={t("filterByStatus")}
            onChange={(event) =>
              update({
                status: event.target.value
                  ? [event.target.value as Project["status"]]
                  : [],
              })
            }
            value={params.status[0] ?? ""}
          >
            <option value="">{t("status")}</option>
            {projectStatuses.map((status) => (
              <option key={status} value={status}>
                {t(`statusValues.${status}`)}
              </option>
            ))}
          </select>
          <select
            aria-label={t("filterByPriority")}
            onChange={(event) =>
              update({
                priority: event.target.value
                  ? [event.target.value as Project["priority"]]
                  : [],
              })
            }
            value={params.priority[0] ?? ""}
          >
            <option value="">{t("priority")}</option>
            {projectPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {t(`priorityValues.${priority}`)}
              </option>
            ))}
          </select>
          <select
            aria-label={t("filterByDeadline")}
            onChange={(event) =>
              update({ deadline: event.target.value as DeadlineFilter })
            }
            value={params.deadline}
          >
            {deadlineFilters.map((filter) => (
              <option key={filter} value={filter}>
                {filter === "any"
                  ? t("deadline")
                  : filter === "none"
                    ? t("noDeadline")
                    : t(filter)}
              </option>
            ))}
          </select>
        </div>
        <MobileFilterControl
          activeFilters={activeFilters}
          onApply={(changes) => update(changes)}
          onClear={clear}
          params={params}
          projectCount={totalCount}
        />
        <select
          aria-label={t("sortProjects")}
          className={styles.sortControl}
          onChange={(event) => update({ sort: event.target.value as ProjectSort })}
          value={params.sort}
        >
          {projectSortOptions.map((sort) => (
            <option key={sort} value={sort}>
              {sortLabels[sort]}
            </option>
          ))}
        </select>
        {params.q || activeFilters || params.sort !== "updated-desc" ? (
          <button className={styles.clearButton} onClick={clear} type="button">
            {t("clear")}
          </button>
        ) : null}
      </section>
      <p aria-live="polite" className="sr-only">
        {t("resultsFound", { count: totalCount })}
      </p>
    </>
  );
}

export function ProjectPagination({
  params,
  total,
}: {
  params: ProjectListParams;
  total: number;
}) {
  const router = useRouter();
  const t = useTranslations("projects");
  const pageCount = Math.max(1, Math.ceil(total / 12));
  const page = Math.min(params.page, pageCount);
  const goToPage = (nextPage: number) =>
    router.replace(projectsHref({ ...params, page: nextPage }), { scroll: false });

  return (
    <nav aria-label={t("pagination")} className={styles.pagination}>
      <p>
        {t("paginationSummary", {
          from: (page - 1) * 12 + 1,
          to: Math.min(page * 12, total),
          total,
        })}
      </p>
      <div>
        <button
          aria-label={t("previousPage")}
          disabled={page === 1}
          onClick={() => goToPage(page - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" size={18} />
          {t("previous")}
        </button>
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
          <button
            aria-current={number === page ? "page" : undefined}
            className={number === page ? styles.currentPage : undefined}
            key={number}
            onClick={() => goToPage(number)}
            type="button"
          >
            {number}
          </button>
        ))}
        <button
          aria-label={t("nextPage")}
          disabled={page === pageCount}
          onClick={() => goToPage(page + 1)}
          type="button"
        >
          {t("next")}
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>
    </nav>
  );
}

export function ClearProjectFiltersButton() {
  const router = useRouter();
  const t = useTranslations("projects");
  return (
    <Button onClick={() => router.replace("/projects")} variant="secondary">
      {t("clearFilters")}
    </Button>
  );
}
