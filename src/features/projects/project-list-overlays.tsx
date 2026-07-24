"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Ellipsis, Filter, X } from "lucide-react";
import Link from "next/link";
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
import { Priority, Status } from "./project-badges";
import styles from "./projects.module.css";

export function ProjectActionMenu({
  onDelete,
  onEdit,
  project,
}: {
  onDelete: (project: Project) => void;
  onEdit: (project: Project) => void;
  project: Project;
}) {
  const t = useTranslations("projects");

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button aria-label={t("actionsForProject", { title: project.title })} type="button">
          <Ellipsis aria-hidden="true" size={21} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        className={styles.actionMenu}
        sideOffset={6}
      >
        <DropdownMenu.Item asChild>
          <Link href={`/projects/${project.id}`}>{t("openProject")}</Link>
        </DropdownMenu.Item>
        <DropdownMenu.Item onSelect={() => onEdit(project)}>
          {t("editProject")}
        </DropdownMenu.Item>
        <DropdownMenu.Item
          className={styles.menuDanger}
          onSelect={() => onDelete(project)}
        >
          {t("deleteProject")}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

export function MobileFilterControl({
  activeFilters,
  onApply,
  onClear,
  params,
  projectCount,
}: {
  activeFilters: number;
  onApply: (params: Partial<ProjectListParams>) => void;
  onClear: () => void;
  params: ProjectListParams;
  projectCount: number;
}) {
  const t = useTranslations("projects");
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className={styles.mobileFilterButton} type="button">
          <Filter aria-hidden="true" size={18} />
          {t("filter")}
          {activeFilters ? <b>{activeFilters}</b> : null}
        </button>
      </Dialog.Trigger>
      <FilterSheet
        key={open ? JSON.stringify(params) : "closed"}
        onApply={(changes) => {
          onApply(changes);
          setOpen(false);
        }}
        onClear={onClear}
        onClose={() => setOpen(false)}
        params={params}
        projectCount={projectCount}
      />
    </Dialog.Root>
  );
}

function FilterSheet({
  onApply,
  onClear,
  onClose,
  params,
  projectCount,
}: {
  onApply: (params: Partial<ProjectListParams>) => void;
  onClear: () => void;
  onClose: () => void;
  params: ProjectListParams;
  projectCount: number;
}) {
  const t = useTranslations("projects");
  const [draft, setDraft] = useState(params);
  const sortLabels: Record<ProjectSort, string> = {
    "updated-desc": t("recentlyUpdated"),
    "created-desc": t("recentlyCreated"),
    "deadline-asc": t("deadlineSort"),
    "title-asc": t("titleSort"),
    "priority-desc": t("prioritySort"),
  };
  const toggle = <T extends string>(
    key: "status" | "priority",
    value: T,
  ) =>
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value as never)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));

  return (
    <Dialog.Portal>
      <Dialog.Overlay className={`${styles.overlay} ${styles.mobileOnlyOverlay}`} />
      <Dialog.Content
        aria-describedby="filter-sheet-description"
        className={`${styles.filterSheet} ${styles.mobileOnlyOverlay}`}
      >
        <header>
          <div>
            <span />
            <Dialog.Title asChild>
              <h2>{t("filterProjects")}</h2>
            </Dialog.Title>
            <Dialog.Description id="filter-sheet-description" className="sr-only">
              {t("filterProjects")}
            </Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <button aria-label={t("closeFilters")} type="button">
              <X aria-hidden="true" size={22} />
            </button>
          </Dialog.Close>
        </header>
        <fieldset>
          <legend>{t("status")}</legend>
          <div className={styles.filterOptions}>
            {projectStatuses.map((status) => (
              <label
                className={draft.status.includes(status) ? styles.selectedFilter : undefined}
                key={status}
              >
                <input
                  checked={draft.status.includes(status)}
                  onChange={() => toggle("status", status)}
                  type="checkbox"
                />
                <Status label={t(`statusValues.${status}`)} value={status} />
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t("priority")}</legend>
          <div className={styles.filterOptions}>
            {projectPriorities.map((priority) => (
              <label
                className={
                  draft.priority.includes(priority) ? styles.selectedFilter : undefined
                }
                key={priority}
              >
                <input
                  checked={draft.priority.includes(priority)}
                  onChange={() => toggle("priority", priority)}
                  type="checkbox"
                />
                <Priority label={t(`priorityValues.${priority}`)} value={priority} />
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t("deadline")}</legend>
          <select
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                deadline: event.target.value as DeadlineFilter,
              }))
            }
            value={draft.deadline}
          >
            {deadlineFilters.map((filter) => (
              <option key={filter} value={filter}>
                {filter === "any"
                  ? t("allDeadlines")
                  : filter === "none"
                    ? t("noDeadline")
                    : t(filter)}
              </option>
            ))}
          </select>
        </fieldset>
        <fieldset>
          <legend>{t("sort")}</legend>
          <select
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                sort: event.target.value as ProjectSort,
              }))
            }
            value={draft.sort}
          >
            {projectSortOptions.map((sort) => (
              <option key={sort} value={sort}>
                {sortLabels[sort]}
              </option>
            ))}
          </select>
        </fieldset>
        <footer>
          <Button
            onClick={() => {
              onClear();
              onClose();
            }}
            variant="secondary"
          >
            {t("clearAll")}
          </Button>
          <Button onClick={() => onApply(draft)}>
            {t("showProjects", { count: projectCount })}
          </Button>
        </footer>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
