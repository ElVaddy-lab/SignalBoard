"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Project } from "@/data/projects";

import { createProjectSchema, projectPriorities, projectStatuses, type ProjectInput } from "./contracts";
import styles from "./projects.module.css";

type ProjectSheetProps = {
  open: boolean;
  project?: Project | null;
  onClose: () => void;
  onSave: (input: ProjectInput) => Promise<void> | void;
};

type FormValues = {
  title: string;
  description: string;
  status: Project["status"];
  priority: Project["priority"];
  projectLead: string;
  deadline: string;
};

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const blankValues: FormValues = { title: "", description: "", status: "Planning", priority: "Medium", projectLead: "", deadline: "" };

const getValues = (project?: Project | null): FormValues => project ? {
  title: project.title,
  description: project.description ?? "",
  status: project.status,
  priority: project.priority,
  projectLead: project.projectLead,
  deadline: project.deadline ?? "",
} : blankValues;

export function ProjectSheet({ open, project, onClose, onSave }: ProjectSheetProps) {
  const titleInput = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Partial<Record<keyof FormValues, FieldElement>>>({});
  const [values, setValues] = useState<FormValues>(() => getValues(project));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const t = useTranslations("projects");
  const common = useTranslations("common");
  const title = project ? t("editProject") : t("createProject");
  const description = project ? t("editDescription") : t("createDescription");
  const deadlineInPast = useMemo(() => values.deadline && values.deadline < new Date().toISOString().slice(0, 10), [values.deadline]);

  const update = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = createProjectSchema.safeParse(values);
    if (!result.success) {
      const nextErrors = Object.fromEntries(result.error.issues.map((issue) => {
        const field = String(issue.path[0]);
        const key = field === "title" ? "validation.title" : field === "description" ? "validation.description" : field === "projectLead" ? "validation.projectLead" : "validation.deadline";
        return [field, t(key)];
      }));
      setErrors(nextErrors);
      setFormError(t("formReview"));
      const firstInvalidField = Object.keys(nextErrors)[0] as keyof FormValues | undefined;
      if (firstInvalidField) queueMicrotask(() => fieldRefs.current[firstInvalidField]?.focus());
      return;
    }
    setPending(true);
    setFormError("");
    try {
      await onSave(result.data);
      onClose();
    } catch {
      setFormError(t("saveFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !pending) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content aria-describedby="project-sheet-description" className={styles.projectSheet} onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }} onOpenAutoFocus={(event) => { event.preventDefault(); titleInput.current?.focus(); }} onPointerDownOutside={(event) => { if (pending) event.preventDefault(); }}>
          <header className={styles.sheetHeader}>
            <div><Dialog.Title asChild><h2>{title}</h2></Dialog.Title><Dialog.Description asChild><p id="project-sheet-description">{description}</p></Dialog.Description></div>
            <Dialog.Close asChild><button aria-label={t("closeProjectForm")} className={styles.sheetClose} disabled={pending} type="button"><X aria-hidden="true" size={22} /></button></Dialog.Close>
          </header>
          <form className={styles.projectForm} onSubmit={submit}>
            {formError ? <div className={styles.formAlert} role="alert"><AlertCircle aria-hidden="true" size={19} />{formError}</div> : null}
            <FieldError error={errors.title} id="project-title" label={t("titleLabel")} required>
              <input aria-describedby={errors.title ? "project-title-error" : undefined} aria-invalid={Boolean(errors.title)} id="project-title" maxLength={100} onChange={(event) => update("title", event.target.value)} placeholder={t("titlePlaceholder")} ref={(element) => { titleInput.current = element; fieldRefs.current.title = element ?? undefined; }} required value={values.title} />
            </FieldError>
            <FieldError error={errors.description} id="project-description" label={t("description")}>
              <textarea aria-describedby={errors.description ? "project-description-error" : undefined} aria-invalid={Boolean(errors.description)} id="project-description" maxLength={1000} onChange={(event) => update("description", event.target.value)} placeholder={t("descriptionPlaceholder")} ref={(element) => { fieldRefs.current.description = element ?? undefined; }} rows={5} value={values.description} />
              <span className={styles.characterCount}>{values.description.length}/1000</span>
            </FieldError>
            <div className={styles.formGrid}>
              <FieldError error={errors.status} id="project-status" label={t("status")} required>
                <select aria-describedby={errors.status ? "project-status-error" : undefined} aria-invalid={Boolean(errors.status)} id="project-status" onChange={(event) => update("status", event.target.value as Project["status"])} ref={(element) => { fieldRefs.current.status = element ?? undefined; }} required value={values.status}>{projectStatuses.map((status) => <option key={status} value={status}>{t(`statusValues.${status}`)}</option>)}</select>
              </FieldError>
              <FieldError error={errors.priority} id="project-priority" label={t("priority")} required>
                <select aria-describedby={errors.priority ? "project-priority-error" : undefined} aria-invalid={Boolean(errors.priority)} id="project-priority" onChange={(event) => update("priority", event.target.value as Project["priority"])} ref={(element) => { fieldRefs.current.priority = element ?? undefined; }} required value={values.priority}>{projectPriorities.map((priority) => <option key={priority} value={priority}>{t(`priorityValues.${priority}`)}</option>)}</select>
              </FieldError>
            </div>
            <FieldError error={errors.projectLead} id="project-lead" label={t("projectLead")} required>
              <input aria-describedby={errors.projectLead ? "project-lead-error" : undefined} aria-invalid={Boolean(errors.projectLead)} id="project-lead" maxLength={80} onChange={(event) => update("projectLead", event.target.value)} placeholder={t("projectLeadPlaceholder")} ref={(element) => { fieldRefs.current.projectLead = element ?? undefined; }} required value={values.projectLead} />
            </FieldError>
            <FieldError error={errors.deadline} id="project-deadline" label={t("deadline")}>
              <input aria-describedby={errors.deadline ? "project-deadline-error" : undefined} aria-invalid={Boolean(errors.deadline)} id="project-deadline" onChange={(event) => update("deadline", event.target.value)} ref={(element) => { fieldRefs.current.deadline = element ?? undefined; }} type="date" value={values.deadline} />
              {deadlineInPast ? <p className={styles.deadlineWarning}>{t("pastDeadlineWarning")}</p> : null}
            </FieldError>
            <footer className={styles.sheetFooter}>
              <Dialog.Close asChild><Button disabled={pending} type="button" variant="secondary">{common("cancel")}</Button></Dialog.Close>
              <Button loading={pending} type="submit">{project ? t("saveChanges") : t("createProject")}</Button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FieldError({ children, error, id, label, required = false }: { children: React.ReactNode; error?: string; id: string; label: string; required?: boolean }) {
  return <div className={styles.formField}><label htmlFor={id}>{label}{required ? <b aria-hidden="true"> *</b> : null}</label>{children}{error ? <small id={`${id}-error`} role="alert">{error}</small> : null}</div>;
}
