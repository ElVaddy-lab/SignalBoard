"use client";

import { Pencil, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Project } from "@/data/projects";

import type { ProjectInput } from "./contracts";
import { deleteProjectAction, updateProjectAction } from "./server";

const ProjectSheet = dynamic(
  () => import("./project-sheet").then((module) => module.ProjectSheet),
  { ssr: false },
);
const DeleteProjectDialog = dynamic(
  () =>
    import("./delete-project-dialog").then((module) => module.DeleteProjectDialog),
  { ssr: false },
);

export function ProjectDetailActions({ project }: { project: Project }) {
  const router = useRouter();
  const t = useTranslations("projects");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async (input: ProjectInput) => {
    await updateProjectAction(project.id, input);
    setEditing(false);
    router.refresh();
  };
  const remove = async () => {
    await deleteProjectAction(project.id);
    router.push("/projects");
    router.refresh();
  };

  return (
    <>
      <div>
        <Button onClick={() => setEditing(true)} variant="secondary">
          <Pencil aria-hidden="true" size={17} />
          {t("edit")}
        </Button>
        <Button onClick={() => setDeleting(true)} variant="ghost">
          <Trash2 aria-hidden="true" size={17} />
          {t("delete")}
        </Button>
      </div>
      {editing ? (
        <ProjectSheet
          key={`${project.id}-open`}
          onClose={() => setEditing(false)}
          onSave={save}
          open
          project={project}
        />
      ) : null}
      {deleting ? (
        <DeleteProjectDialog
          onClose={() => setDeleting(false)}
          onConfirm={remove}
          open
          projectTitle={project.title}
        />
      ) : null}
    </>
  );
}
