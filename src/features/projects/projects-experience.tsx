"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import type { Project } from "@/data/projects";

import type { ProjectInput } from "./contracts";
import { ProjectsActionsContext } from "./projects-actions-context";
import { createProjectAction, deleteProjectAction, updateProjectAction } from "./server";

const ProjectSheet = dynamic(
  () => import("./project-sheet").then((module) => module.ProjectSheet),
  { ssr: false },
);
const DeleteProjectDialog = dynamic(
  () =>
    import("./delete-project-dialog").then((module) => module.DeleteProjectDialog),
  { ssr: false },
);

export function ProjectsExperience({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sheetProject, setSheetProject] = useState<Project | null | undefined>(() =>
    searchParams.get("new") === "1" ? null : undefined,
  );
  const [deleting, setDeleting] = useState<Project | null>(null);

  const save = async (input: ProjectInput) => {
    if (sheetProject) await updateProjectAction(sheetProject.id, input);
    else await createProjectAction(input);
    setSheetProject(undefined);
    router.replace("/projects", { scroll: false });
    router.refresh();
  };
  const remove = async () => {
    if (!deleting) return;
    await deleteProjectAction(deleting.id);
    setDeleting(null);
    router.refresh();
  };

  return (
    <ProjectsActionsContext.Provider
      value={{
        createProject: () => setSheetProject(null),
        deleteProject: setDeleting,
        editProject: setSheetProject,
      }}
    >
      {children}
      {sheetProject !== undefined ? (
        <ProjectSheet
          key={sheetProject?.id ?? "new"}
          onClose={() => setSheetProject(undefined)}
          onSave={save}
          open
          project={sheetProject}
        />
      ) : null}
      {deleting ? (
        <DeleteProjectDialog
          onClose={() => setDeleting(null)}
          onConfirm={remove}
          open
          projectTitle={deleting.title}
        />
      ) : null}
    </ProjectsActionsContext.Provider>
  );
}
