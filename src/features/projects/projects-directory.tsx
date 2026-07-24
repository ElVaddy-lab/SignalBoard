import { Search } from "lucide-react";
import Link from "next/link";
import { createTranslator } from "next-intl";

import { ProgressBar } from "@/components/ui/progress-bar";
import type { Project } from "@/data/projects";
import { getDeadlineState } from "@/features/dashboard/contracts";
import { getLocale } from "@/features/preferences/locale";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

import type { ProjectListParams } from "./project-list-contract";
import {
  ClearProjectFiltersButton,
  ProjectDirectoryControls,
  ProjectPagination,
} from "./project-directory-controls";
import { Priority, Status } from "./project-badges";
import {
  ProjectCardActions,
  ProjectCreateButton,
  ProjectRowActions,
} from "./projects-actions";
import { deadlineLabel, formatDate } from "./project-presentation";
import styles from "./projects.module.css";

type DeadlineLabels = {
  none: string;
  overdue: string;
  upcoming: string;
  completed: string;
  scheduled: string;
};

export async function ProjectsDirectory({
  params,
  projects,
  totalCount,
}: {
  params: ProjectListParams;
  projects: Project[];
  totalCount: number;
}) {
  const locale = await getLocale();
  const t = createTranslator({
    locale,
    messages: getMessages(locale),
    namespace: "projects",
  });
  const deadlineLabels: DeadlineLabels = {
    none: t("noDeadline"),
    overdue: t("overdue"),
    upcoming: t("upcoming"),
    completed: t("completed"),
    scheduled: t("scheduled"),
  };
  const statusLabels = {
    Planning: t("statusValues.Planning"),
    Active: t("statusValues.Active"),
    Review: t("statusValues.Review"),
    Completed: t("statusValues.Completed"),
  };
  const priorityLabels = {
    Low: t("priorityValues.Low"),
    Medium: t("priorityValues.Medium"),
    High: t("priorityValues.High"),
  };

  return (
    <div className={styles.projectsExperience}>
      <header className={styles.projectsHeading}>
        <div>
          <h1>{t("title")}</h1>
          <p>{t("projectCount", { count: totalCount })}</p>
        </div>
        <ProjectCreateButton />
      </header>
      <ProjectDirectoryControls
        key={JSON.stringify(params)}
        initialParams={params}
        totalCount={totalCount}
      />
      {totalCount ? (
        <>
          <div className={styles.desktopTableWrap}>
            <table className={styles.projectTable}>
              <caption className="sr-only">{t("matchingCaption")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("project")}</th>
                  <th scope="col">{t("status")}</th>
                  <th scope="col">{t("priority")}</th>
                  <th scope="col">{t("projectLead")}</th>
                  <th scope="col">{t("completion")}</th>
                  <th scope="col">{t("deadline")}</th>
                  <th scope="col">{t("updated")}</th>
                  <th>
                    <span className="sr-only">{t("actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <ProjectTableRow
                    deadlineLabels={deadlineLabels}
                    key={project.id}
                    locale={locale}
                    priorityLabel={priorityLabels[project.priority]}
                    project={project}
                    statusLabel={statusLabels[project.status]}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.mobileCards}>
            {projects.map((project) => (
              <ProjectCard
                completionLabel={t("completionPercent", {
                  value: project.completion,
                })}
                deadlineLabels={deadlineLabels}
                key={project.id}
                labels={{
                  projectLead: t("projectLead"),
                  updated: t("updated"),
                  viewProject: t("viewProject"),
                }}
                locale={locale}
                priorityLabel={priorityLabels[project.priority]}
                project={project}
                statusLabel={statusLabels[project.status]}
              />
            ))}
          </div>
          <ProjectPagination params={params} total={totalCount} />
        </>
      ) : (
        <NoResults
          description={t("noResultsDescription")}
          title={t("noResultsTitle")}
        />
      )}
    </div>
  );
}

function ProjectTableRow({
  deadlineLabels,
  locale,
  priorityLabel,
  project,
  statusLabel,
}: {
  deadlineLabels: DeadlineLabels;
  locale: AppLocale;
  priorityLabel: string;
  project: Project;
  statusLabel: string;
}) {
  const overdue = getDeadlineState(project.deadline, project.status) === "overdue";

  return (
    <tr>
      <th scope="row">
        <Link href={`/projects/${project.id}`}>{project.title}</Link>
      </th>
      <td>
        <Status label={statusLabel} value={project.status} />
      </td>
      <td>
        <Priority label={priorityLabel} value={project.priority} />
      </td>
      <td>{project.projectLead}</td>
      <td>
        <div className={styles.completionCell}>
          <span>{project.completion}%</span>
          <ProgressBar value={project.completion} />
        </div>
      </td>
      <td>
        <span className={overdue ? styles.overdueText : undefined}>
          {formatDate(project.deadline, locale, deadlineLabels.none)}
          <small>{deadlineLabel(project, deadlineLabels)}</small>
        </span>
      </td>
      <td>{formatDate(project.updatedAt.slice(0, 10), locale, deadlineLabels.none)}</td>
      <td className={styles.rowActions}>
        <ProjectRowActions project={project} />
      </td>
    </tr>
  );
}

function ProjectCard({
  completionLabel,
  deadlineLabels,
  labels,
  locale,
  priorityLabel,
  project,
  statusLabel,
}: {
  completionLabel: string;
  deadlineLabels: DeadlineLabels;
  labels: { projectLead: string; updated: string; viewProject: string };
  locale: AppLocale;
  priorityLabel: string;
  project: Project;
  statusLabel: string;
}) {
  const overdue = getDeadlineState(project.deadline, project.status) === "overdue";

  return (
    <article className={styles.projectCard}>
      <div className={styles.cardTop}>
        <Link href={`/projects/${project.id}`}>
          <h2>{project.title}</h2>
        </Link>
        <span className={overdue ? styles.overdueText : undefined}>
          {formatDate(project.deadline, locale, deadlineLabels.none)}
        </span>
      </div>
      <div className={styles.cardTags}>
        <Status label={statusLabel} value={project.status} />
        <Priority label={priorityLabel} value={project.priority} />
      </div>
      <dl>
        <div>
          <dt>{labels.projectLead}</dt>
          <dd>{project.projectLead}</dd>
        </div>
        <div>
          <dt>{labels.updated}</dt>
          <dd>{formatDate(project.updatedAt.slice(0, 10), locale, deadlineLabels.none)}</dd>
        </div>
      </dl>
      <div className={styles.cardProgress}>
        <span>{completionLabel}</span>
        <ProgressBar value={project.completion} />
      </div>
      <div className={styles.cardActions}>
        <Link href={`/projects/${project.id}`}>{labels.viewProject}</Link>
        <ProjectCardActions project={project} />
      </div>
    </article>
  );
}

function NoResults({ description, title }: { description: string; title: string }) {
  return (
    <section className={styles.noResults}>
      <span>
        <Search aria-hidden="true" size={30} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <ClearProjectFiltersButton />
    </section>
  );
}
