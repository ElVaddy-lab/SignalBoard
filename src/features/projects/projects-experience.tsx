"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import type { Project } from "@/data/projects";

import type { ProjectInput } from "./contracts";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { ProjectsList } from "./projects-list";
import { ProjectSheet } from "./project-sheet";
import { createProjectAction, deleteProjectAction, updateProjectAction } from "./server";

export function ProjectsExperience({ initialParams, initialProjects, totalCount }: { initialParams: import("./contracts").ProjectListParams; initialProjects: Project[]; totalCount: number }) {
  const router = useRouter();
  const t = useTranslations("projects");
  const searchParams = useSearchParams();
  const [sheetProject, setSheetProject] = useState<Project | null | undefined>(() => searchParams.get("new") === "1" ? null : undefined);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const save = async (input: ProjectInput) => {
    if (sheetProject) await updateProjectAction(sheetProject.id, input);
    else await createProjectAction(input);
    router.replace("/projects", { scroll: false });
    router.refresh();
  };

  const remove = async () => {
    if (!deleting) return;
    await deleteProjectAction(deleting.id);
    router.refresh();
  };

  return <>
    <ProjectsList initialParams={initialParams} onCreate={() => setSheetProject(null)} onDelete={setDeleting} onEdit={setSheetProject} projects={initialProjects} totalCount={totalCount} />
    <ProjectSheet key={sheetProject?.id ?? (sheetProject === null ? "new" : "closed")} onClose={() => setSheetProject(undefined)} onSave={save} open={sheetProject !== undefined} project={sheetProject} />
    <DeleteProjectDialog onClose={() => setDeleting(null)} onConfirm={remove} open={Boolean(deleting)} projectTitle={deleting?.title ?? t("deletedProjectFallback")} />
  </>;
}
