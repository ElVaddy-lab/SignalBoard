"use client";

import { ChevronLeft, ChevronRight, Ellipsis, Filter, Plus, Search, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Project } from "@/data/projects";
import { getDeadlineState } from "@/features/dashboard/contracts";
import type { AppLocale } from "@/i18n/config";

import { deadlineFilters, projectPriorities, projectSortOptions, projectStatuses, type DeadlineFilter, type ProjectListParams, type ProjectSort } from "./contracts";
import { deadlineLabel, formatDate, statusTone } from "./project-presentation";
import styles from "./projects.module.css";

type ProjectsListProps = {
  projects: Project[];
  totalCount: number;
  initialParams: ProjectListParams;
  onCreate: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
};

function sortProjects(projects: Project[], sort: ProjectSort) {
  const priorityRank = { High: 3, Medium: 2, Low: 1 };
  return [...projects].sort((a, b) => {
    if (sort === "title-asc") return a.title.localeCompare(b.title);
    if (sort === "priority-desc") return priorityRank[b.priority] - priorityRank[a.priority] || b.updatedAt.localeCompare(a.updatedAt);
    if (sort === "deadline-asc") return (a.deadline ?? "9999-12-31").localeCompare(b.deadline ?? "9999-12-31");
    if (sort === "created-desc") return b.createdAt.localeCompare(a.createdAt);
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function filterProjects(projects: Project[], params: ProjectListParams, today = new Date()) {
  const query = params.q.toLocaleLowerCase();
  return sortProjects(projects.filter((project) => {
    const textMatches = !query || [project.title, project.description ?? "", project.projectLead].some((value) => value.toLocaleLowerCase().includes(query));
    const statusMatches = !params.status.length || params.status.includes(project.status);
    const priorityMatches = !params.priority.length || params.priority.includes(project.priority);
    const deadlineMatches = params.deadline === "any" || getDeadlineState(project.deadline, project.status, today) === params.deadline;
    return textMatches && statusMatches && priorityMatches && deadlineMatches;
  }), params.sort);
}

function useDeadlineLabels() {
  const t = useTranslations("projects");
  return { none: t("noDeadline"), overdue: t("overdue"), upcoming: t("upcoming"), completed: t("completed"), scheduled: t("scheduled") };
}

export function ProjectsList({ initialParams, projects, totalCount, onCreate, onDelete, onEdit }: ProjectsListProps) {
  const router = useRouter();
  const t = useTranslations("projects");
  const [params, setParams] = useState<ProjectListParams>(initialParams);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pageCount = Math.max(1, Math.ceil(totalCount / 12));
  const page = Math.min(params.page, pageCount);
  const sortLabels: Record<ProjectSort, string> = {
    "updated-desc": t("recentlyUpdated"), "created-desc": t("recentlyCreated"), "deadline-asc": t("deadlineSort"), "title-asc": t("titleSort"), "priority-desc": t("prioritySort"),
  };

  useEffect(() => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status.length) query.set("status", params.status.join(","));
    if (params.priority.length) query.set("priority", params.priority.join(","));
    if (params.deadline !== "any") query.set("deadline", params.deadline);
    if (params.sort !== "updated-desc") query.set("sort", params.sort);
    if (params.page > 1) query.set("page", String(params.page));
    const next = `${window.location.pathname}${query.size ? `?${query}` : ""}`;
    router.replace(next, { scroll: false });
  }, [params, router]);

  const update = (changes: Partial<ProjectListParams>, resetPage = true) => setParams((current) => ({ ...current, ...changes, page: resetPage ? 1 : changes.page ?? current.page }));
  const clear = () => setParams({ q: "", status: [], priority: [], deadline: "any", sort: "updated-desc", page: 1 });
  const activeFilters = params.status.length + params.priority.length + (params.deadline !== "any" ? 1 : 0);

  return <div className={styles.projectsExperience}>
    <header className={styles.projectsHeading}>
      <div><h1>{t("title")}</h1><p>{t("projectCount", { count: totalCount })}</p></div>
      <Button className={styles.projectsCreate} onClick={onCreate}><Plus aria-hidden="true" size={18} />{t("createProject")}</Button>
    </header>
    <section aria-label={t("filterProjects")} className={styles.projectControls}>
      <label className={styles.searchField}><Search aria-hidden="true" size={19} /><span className="sr-only">{t("search")}</span><input onChange={(event) => update({ q: event.target.value })} placeholder={t("searchPlaceholder")} value={params.q} />{params.q ? <button aria-label={t("clearSearch")} onClick={() => update({ q: "" })} type="button"><X aria-hidden="true" size={17} /></button> : null}</label>
      <div className={styles.desktopFilters}>
        <select aria-label={t("filterByStatus")} onChange={(event) => update({ status: event.target.value ? [event.target.value as Project["status"]] : [] })} value={params.status[0] ?? ""}><option value="">{t("status")}</option>{projectStatuses.map((status) => <option key={status} value={status}>{t(`statusValues.${status}`)}</option>)}</select>
        <select aria-label={t("filterByPriority")} onChange={(event) => update({ priority: event.target.value ? [event.target.value as Project["priority"]] : [] })} value={params.priority[0] ?? ""}><option value="">{t("priority")}</option>{projectPriorities.map((priority) => <option key={priority} value={priority}>{t(`priorityValues.${priority}`)}</option>)}</select>
        <select aria-label={t("filterByDeadline")} onChange={(event) => update({ deadline: event.target.value as DeadlineFilter })} value={params.deadline}>{deadlineFilters.map((filter) => <option key={filter} value={filter}>{filter === "any" ? t("deadline") : filter === "none" ? t("noDeadline") : t(filter)}</option>)}</select>
      </div>
      <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Dialog.Trigger asChild><button className={styles.mobileFilterButton} type="button"><Filter aria-hidden="true" size={18} />{t("filter")}{activeFilters ? <b>{activeFilters}</b> : null}</button></Dialog.Trigger>
        <FilterSheet key={filtersOpen ? JSON.stringify(params) : "closed"} onApply={(changes) => { update(changes); setFiltersOpen(false); }} onClear={clear} onClose={() => setFiltersOpen(false)} params={params} projectCount={totalCount} />
      </Dialog.Root>
      <select aria-label={t("sortProjects")} className={styles.sortControl} onChange={(event) => update({ sort: event.target.value as ProjectSort })} value={params.sort}>{projectSortOptions.map((sort) => <option key={sort} value={sort}>{sortLabels[sort]}</option>)}</select>
      {(params.q || activeFilters || params.sort !== "updated-desc") ? <button className={styles.clearButton} onClick={clear} type="button">{t("clear")}</button> : null}
    </section>
    <p aria-live="polite" className="sr-only">{t("resultsFound", { count: totalCount })}</p>
    {totalCount ? <>
      <div className={styles.desktopTableWrap}><table className={styles.projectTable}><caption className="sr-only">{t("matchingCaption")}</caption><thead><tr><th scope="col">{t("project")}</th><th scope="col">{t("status")}</th><th scope="col">{t("priority")}</th><th scope="col">{t("projectLead")}</th><th scope="col">{t("completion")}</th><th scope="col">{t("deadline")}</th><th scope="col">{t("updated")}</th><th><span className="sr-only">{t("actions")}</span></th></tr></thead><tbody>{projects.map((project) => <ProjectTableRow key={project.id} onDelete={onDelete} onEdit={onEdit} project={project} />)}</tbody></table></div>
      <div className={styles.mobileCards}>{projects.map((project) => <ProjectCard key={project.id} onDelete={onDelete} onEdit={onEdit} project={project} />)}</div>
      <Pagination onPage={(next) => update({ page: next }, false)} page={page} pageCount={pageCount} total={totalCount} />
    </> : <NoResults onClear={clear} />}
  </div>;
}

function ProjectTableRow({ onDelete, onEdit, project }: { onDelete: (project: Project) => void; onEdit: (project: Project) => void; project: Project }) {
  const t = useTranslations("projects");
  const locale = useLocale() as AppLocale;
  const deadlineLabels = useDeadlineLabels();
  return <tr><th scope="row"><Link href={`/projects/${project.id}`}>{project.title}</Link></th><td><Status value={project.status} /></td><td><Priority value={project.priority} /></td><td>{project.projectLead}</td><td><div className={styles.completionCell}><span>{project.completion}%</span><ProgressBar value={project.completion} /></div></td><td><span className={getDeadlineState(project.deadline, project.status) === "overdue" ? styles.overdueText : undefined}>{formatDate(project.deadline, locale, deadlineLabels.none)}<small>{deadlineLabel(project, deadlineLabels)}</small></span></td><td>{formatDate(project.updatedAt.slice(0, 10), locale, deadlineLabels.none)}</td><td className={styles.rowActions}><DropdownMenu.Root><DropdownMenu.Trigger asChild><button aria-label={t("actionsForProject", { title: project.title })} type="button"><Ellipsis aria-hidden="true" size={21} /></button></DropdownMenu.Trigger><DropdownMenu.Content align="end" className={styles.actionMenu} sideOffset={6}><DropdownMenu.Item asChild><Link href={`/projects/${project.id}`}>{t("openProject")}</Link></DropdownMenu.Item><DropdownMenu.Item onSelect={() => onEdit(project)}>{t("editProject")}</DropdownMenu.Item><DropdownMenu.Item className={styles.menuDanger} onSelect={() => onDelete(project)}>{t("deleteProject")}</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Root></td></tr>;
}

function ProjectCard({ onDelete, onEdit, project }: { project: Project; onDelete: (project: Project) => void; onEdit: (project: Project) => void }) {
  const t = useTranslations("projects");
  const locale = useLocale() as AppLocale;
  const deadlineLabels = useDeadlineLabels();
  return <article className={styles.projectCard}><div className={styles.cardTop}><Link href={`/projects/${project.id}`}><h2>{project.title}</h2></Link><span className={getDeadlineState(project.deadline, project.status) === "overdue" ? styles.overdueText : undefined}>{formatDate(project.deadline, locale, deadlineLabels.none)}</span></div><div className={styles.cardTags}><Status value={project.status} /><Priority value={project.priority} /></div><dl><div><dt>{t("projectLead")}</dt><dd>{project.projectLead}</dd></div><div><dt>{t("updated")}</dt><dd>{formatDate(project.updatedAt.slice(0, 10), locale, deadlineLabels.none)}</dd></div></dl><div className={styles.cardProgress}><span>{t("completionPercent", { value: project.completion })}</span><ProgressBar value={project.completion} /></div><div className={styles.cardActions}><Link href={`/projects/${project.id}`}>{t("viewProject")}</Link><button onClick={() => onEdit(project)} type="button">{t("edit")}</button><button onClick={() => onDelete(project)} type="button">{t("delete")}</button></div></article>;
}

export function Status({ value }: { value: Project["status"] }) { const t = useTranslations("projects"); return <span className={`${styles.dotLabel} ${styles[statusTone[value]]}`}><i aria-hidden="true" />{t(`statusValues.${value}`)}</span>; }
export function Priority({ value }: { value: Project["priority"] }) { const t = useTranslations("projects"); return <span className={`${styles.dotLabel} ${styles[value.toLowerCase()]}`}><i aria-hidden="true" />{t(`priorityValues.${value}`)}</span>; }

function Pagination({ onPage, page, pageCount, total }: { onPage: (page: number) => void; page: number; pageCount: number; total: number }) {
  const t = useTranslations("projects");
  return <nav aria-label={t("pagination")} className={styles.pagination}><p>{t("paginationSummary", { from: (page - 1) * 12 + 1, to: Math.min(page * 12, total), total })}</p><div><button aria-label={t("previousPage")} disabled={page === 1} onClick={() => onPage(page - 1)} type="button"><ChevronLeft aria-hidden="true" size={18} />{t("previous")}</button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button aria-current={number === page ? "page" : undefined} className={number === page ? styles.currentPage : undefined} key={number} onClick={() => onPage(number)} type="button">{number}</button>)}<button aria-label={t("nextPage")} disabled={page === pageCount} onClick={() => onPage(page + 1)} type="button">{t("next")}<ChevronRight aria-hidden="true" size={18} /></button></div></nav>;
}

function NoResults({ onClear }: { onClear: () => void }) { const t = useTranslations("projects"); return <section className={styles.noResults}><span><Search aria-hidden="true" size={30} /></span><h2>{t("noResultsTitle")}</h2><p>{t("noResultsDescription")}</p><Button onClick={onClear} variant="secondary">{t("clearFilters")}</Button></section>; }

function FilterSheet({ onApply, onClear, onClose, params, projectCount }: { onApply: (params: Partial<ProjectListParams>) => void; onClear: () => void; onClose: () => void; params: ProjectListParams; projectCount: number }) {
  const t = useTranslations("projects");
  const [draft, setDraft] = useState(params);
  const sortLabels: Record<ProjectSort, string> = { "updated-desc": t("recentlyUpdated"), "created-desc": t("recentlyCreated"), "deadline-asc": t("deadlineSort"), "title-asc": t("titleSort"), "priority-desc": t("prioritySort") };
  const toggle = <T extends string>(key: "status" | "priority", value: T) => setDraft((current) => ({ ...current, [key]: current[key].includes(value as never) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  return <Dialog.Portal><Dialog.Overlay className={`${styles.overlay} ${styles.mobileOnlyOverlay}`} /><Dialog.Content aria-describedby="filter-sheet-description" className={`${styles.filterSheet} ${styles.mobileOnlyOverlay}`}><header><div><span /><Dialog.Title asChild><h2>{t("filterProjects")}</h2></Dialog.Title><Dialog.Description id="filter-sheet-description" className="sr-only">{t("filterProjects")}</Dialog.Description></div><Dialog.Close asChild><button aria-label={t("closeFilters")} type="button"><X aria-hidden="true" size={22} /></button></Dialog.Close></header><fieldset><legend>{t("status")}</legend><div className={styles.filterOptions}>{projectStatuses.map((status) => <label className={draft.status.includes(status) ? styles.selectedFilter : undefined} key={status}><input checked={draft.status.includes(status)} onChange={() => toggle("status", status)} type="checkbox" /><Status value={status} /></label>)}</div></fieldset><fieldset><legend>{t("priority")}</legend><div className={styles.filterOptions}>{projectPriorities.map((priority) => <label className={draft.priority.includes(priority) ? styles.selectedFilter : undefined} key={priority}><input checked={draft.priority.includes(priority)} onChange={() => toggle("priority", priority)} type="checkbox" /><Priority value={priority} /></label>)}</div></fieldset><fieldset><legend>{t("deadline")}</legend><select onChange={(event) => setDraft((current) => ({ ...current, deadline: event.target.value as DeadlineFilter }))} value={draft.deadline}>{deadlineFilters.map((filter) => <option key={filter} value={filter}>{filter === "any" ? t("allDeadlines") : filter === "none" ? t("noDeadline") : t(filter)}</option>)}</select></fieldset><fieldset><legend>{t("sort")}</legend><select onChange={(event) => setDraft((current) => ({ ...current, sort: event.target.value as ProjectSort }))} value={draft.sort}>{projectSortOptions.map((sort) => <option key={sort} value={sort}>{sortLabels[sort]}</option>)}</select></fieldset><footer><Button onClick={() => { onClear(); onClose(); }} variant="secondary">{t("clearAll")}</Button><Button onClick={() => onApply(draft)}>{t("showProjects", { count: projectCount })}</Button></footer></Dialog.Content></Dialog.Portal>;
}
