import Link from "next/link";
import type { ReactNode } from "react";

import { ProgressBar } from "@/components/ui/progress-bar";
import type {
  Project,
  ProjectPriority,
  ProjectStatus,
} from "@/data/projects";
import { getDeadlineState } from "@/features/dashboard/contracts";
import type { AppLocale } from "@/i18n/config";

import { Priority, Status } from "./project-badges";
import { deadlineLabel, formatDate } from "./project-presentation";
import styles from "./projects.module.css";

export type ProjectDeadlineLabels = {
  none: string;
  overdue: string;
  upcoming: string;
  completed: string;
  scheduled: string;
};

export type ProjectsListLabels = {
  actions: string;
  completion: string;
  deadline: string;
  matchingCaption: string;
  priority: string;
  project: string;
  projectLead: string;
  status: string;
  updated: string;
  viewProject: string;
  completionPercent: (value: number) => string;
  priorityValues: Record<ProjectPriority, string>;
  statusValues: Record<ProjectStatus, string>;
};

export type ProjectsListActions = {
  card: (project: Project) => ReactNode;
  row: (project: Project) => ReactNode;
};

export function ProjectsListPresentation({
  actions,
  basePath,
  deadlineLabels,
  labels,
  locale,
  projects,
}: {
  actions?: ProjectsListActions;
  basePath: string;
  deadlineLabels: ProjectDeadlineLabels;
  labels: ProjectsListLabels;
  locale: AppLocale;
  projects: Project[];
}) {
  return (
    <>
      <div className={styles.desktopTableWrap}>
        <table className={styles.projectTable} data-testid="projects-table">
          <caption className="sr-only">{labels.matchingCaption}</caption>
          <thead>
            <tr>
              <th data-project-field="project" scope="col">
                {labels.project}
              </th>
              <th data-project-field="status" scope="col">
                {labels.status}
              </th>
              <th data-project-field="priority" scope="col">
                {labels.priority}
              </th>
              <th data-project-field="lead" scope="col">
                {labels.projectLead}
              </th>
              <th data-project-field="completion" scope="col">
                {labels.completion}
              </th>
              <th data-project-field="deadline" scope="col">
                {labels.deadline}
              </th>
              <th data-project-field="updated" scope="col">
                {labels.updated}
              </th>
              {actions ? (
                <th data-project-field="actions" scope="col">
                  <span className="sr-only">{labels.actions}</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <ProjectTableRow
                action={actions?.row(project)}
                basePath={basePath}
                deadlineLabels={deadlineLabels}
                key={project.id}
                labels={labels}
                locale={locale}
                project={project}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.mobileCards} data-testid="projects-cards">
        {projects.map((project) => (
          <ProjectCard
            action={actions?.card(project)}
            basePath={basePath}
            deadlineLabels={deadlineLabels}
            key={project.id}
            labels={labels}
            locale={locale}
            project={project}
          />
        ))}
      </div>
    </>
  );
}

function ProjectTableRow({
  action,
  basePath,
  deadlineLabels,
  labels,
  locale,
  project,
}: {
  action?: ReactNode;
  basePath: string;
  deadlineLabels: ProjectDeadlineLabels;
  labels: ProjectsListLabels;
  locale: AppLocale;
  project: Project;
}) {
  const overdue = getDeadlineState(project.deadline, project.status) === "overdue";
  const completionLabel = labels.completionPercent(project.completion);

  return (
    <tr data-project-status={project.status}>
      <th data-project-field="project" scope="row">
        <Link href={`${basePath}/${project.id}`}>{project.title}</Link>
      </th>
      <td data-project-field="status">
        <Status label={labels.statusValues[project.status]} value={project.status} />
      </td>
      <td data-project-field="priority">
        <Priority
          label={labels.priorityValues[project.priority]}
          value={project.priority}
        />
      </td>
      <td data-project-field="lead">{project.projectLead}</td>
      <td data-project-field="completion">
        <div className={styles.completionCell}>
          <span>{project.completion}%</span>
          <ProgressBar
            ariaLabel={completionLabel}
            className={styles.tableProgressTrack}
            value={project.completion}
          />
        </div>
      </td>
      <td data-project-field="deadline">
        <span className={overdue ? styles.overdueText : undefined}>
          {formatDate(project.deadline, locale, deadlineLabels.none)}
          <small>{deadlineLabel(project, deadlineLabels)}</small>
        </span>
      </td>
      <td data-project-field="updated">
        {formatDate(project.updatedAt.slice(0, 10), locale, deadlineLabels.none)}
      </td>
      {action ? (
        <td className={styles.rowActions} data-project-field="actions">
          {action}
        </td>
      ) : null}
    </tr>
  );
}

function ProjectCard({
  action,
  basePath,
  deadlineLabels,
  labels,
  locale,
  project,
}: {
  action?: ReactNode;
  basePath: string;
  deadlineLabels: ProjectDeadlineLabels;
  labels: ProjectsListLabels;
  locale: AppLocale;
  project: Project;
}) {
  const overdue = getDeadlineState(project.deadline, project.status) === "overdue";
  const completionLabel = labels.completionPercent(project.completion);

  return (
    <article className={styles.projectCard} data-project-card>
      <div className={styles.cardTop} data-project-field="project">
        <Link href={`${basePath}/${project.id}`}>
          <h2>{project.title}</h2>
        </Link>
        <span className={overdue ? styles.overdueText : undefined}>
          {formatDate(project.deadline, locale, deadlineLabels.none)}
        </span>
      </div>
      <div className={styles.cardTags}>
        <span data-project-field="status">
          <Status label={labels.statusValues[project.status]} value={project.status} />
        </span>
        <span data-project-field="priority">
          <Priority
            label={labels.priorityValues[project.priority]}
            value={project.priority}
          />
        </span>
      </div>
      <dl>
        <div data-project-field="lead">
          <dt>{labels.projectLead}</dt>
          <dd>{project.projectLead}</dd>
        </div>
        <div data-project-field="updated">
          <dt>{labels.updated}</dt>
          <dd>
            {formatDate(
              project.updatedAt.slice(0, 10),
              locale,
              deadlineLabels.none,
            )}
          </dd>
        </div>
      </dl>
      <div className={styles.cardProgress} data-project-field="completion">
        <span>{completionLabel}</span>
        <ProgressBar
          ariaLabel={completionLabel}
          className={styles.cardProgressTrack}
          value={project.completion}
        />
      </div>
      <div className={styles.cardActions}>
        <Link href={`${basePath}/${project.id}`}>{labels.viewProject}</Link>
        {action}
      </div>
    </article>
  );
}
