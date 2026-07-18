import type { AppLocale } from "@/i18n/config";
import type { Project, ProjectPriority, ProjectStatus } from "@/data/projects";
import { getDeadlineState } from "@/features/dashboard/contracts";

export const statusTone: Record<ProjectStatus, string> = {
  Planning: "planning",
  Active: "active",
  Review: "review",
  Completed: "completed",
};

export const priorityTone: Record<ProjectPriority, string> = {
  Low: "low",
  Medium: "medium",
  High: "high",
};

export function formatDate(value: string | null, locale: AppLocale, noDeadline: string) {
  if (!value) return noDeadline;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export function formatDateTime(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function deadlineLabel(project: Project, labels: Record<"none" | "overdue" | "upcoming" | "completed" | "scheduled", string>, today = new Date()) {
  const state = getDeadlineState(project.deadline, project.status, today);
  if (state === "none") return labels.none;
  if (state === "overdue") return labels.overdue;
  if (state === "upcoming") return labels.upcoming;
  if (state === "completed") return labels.completed;
  return labels.scheduled;
}
