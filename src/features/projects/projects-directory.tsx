import { Search } from "lucide-react";
import { createTranslator } from "next-intl";

import type { Project } from "@/data/projects";
import { getLocale } from "@/features/preferences/locale";
import { getMessages } from "@/i18n/messages";

import type { ProjectListParams } from "./project-list-contract";
import {
  ClearProjectFiltersButton,
  ProjectDirectoryControls,
  ProjectPagination,
} from "./project-directory-controls";
import {
  ProjectCardActions,
  ProjectCreateButton,
  ProjectRowActions,
} from "./projects-actions";
import { ProjectsListPresentation } from "./projects-list-presentation";
import styles from "./projects.module.css";

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

  const deadlineLabels = {
    none: t("noDeadline"),
    overdue: t("overdue"),
    upcoming: t("upcoming"),
    completed: t("completed"),
    scheduled: t("scheduled"),
  };
  const labels = {
    actions: t("actions"),
    completion: t("completion"),
    completionPercent: (value: number) => t("completionPercent", { value }),
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
          <ProjectsListPresentation
            actions={{
              card: (project) => <ProjectCardActions project={project} />,
              row: (project) => <ProjectRowActions project={project} />,
            }}
            basePath="/projects"
            deadlineLabels={deadlineLabels}
            labels={labels}
            locale={locale}
            projects={projects}
          />
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
