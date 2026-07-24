"use client";

import { Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useContext } from "react";

import { Button } from "@/components/ui/button";
import type { Project } from "@/data/projects";

import { ProjectsActionsContext } from "./projects-actions-context";
import styles from "./projects.module.css";

const ProjectActionMenu = dynamic(
  () =>
    import("./project-list-overlays").then((module) => module.ProjectActionMenu),
  {
    loading: () => <span aria-hidden="true" className={styles.actionMenuPlaceholder} />,
    ssr: false,
  },
);

function useProjectsActions() {
  const actions = useContext(ProjectsActionsContext);
  if (!actions) throw new Error("Project actions must be rendered inside ProjectsExperience.");
  return actions;
}

export function ProjectCreateButton() {
  const t = useTranslations("projects");
  const { createProject } = useProjectsActions();
  return (
    <Button className={styles.projectsCreate} onClick={createProject}>
      <Plus aria-hidden="true" size={18} />
      {t("createProject")}
    </Button>
  );
}

export function ProjectRowActions({ project }: { project: Project }) {
  const { deleteProject, editProject } = useProjectsActions();
  return (
    <ProjectActionMenu
      onDelete={deleteProject}
      onEdit={editProject}
      project={project}
    />
  );
}

export function ProjectCardActions({ project }: { project: Project }) {
  const t = useTranslations("projects");
  const { deleteProject, editProject } = useProjectsActions();
  return (
    <>
      <button onClick={() => editProject(project)} type="button">
        {t("edit")}
      </button>
      <button onClick={() => deleteProject(project)} type="button">
        {t("delete")}
      </button>
    </>
  );
}
