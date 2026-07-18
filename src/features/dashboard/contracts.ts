import type { Project, ProjectStatus } from "@/data/projects";

export type DeadlineState = "none" | "overdue" | "upcoming" | "scheduled" | "completed";

const dateKey = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");

export function getDeadlineState(deadline: string | null, status: ProjectStatus, today = new Date()): DeadlineState {
  if (!deadline) return "none";
  if (status === "Completed") return "completed";
  const current = dateKey(today);
  const finalUpcoming = new Date(today);
  finalUpcoming.setDate(finalUpcoming.getDate() + 14);
  if (deadline < current) return "overdue";
  if (deadline <= dateKey(finalUpcoming)) return "upcoming";
  return "scheduled";
}

export function calculateDashboardMetrics(projects: Project[], today = new Date()) {
  const total = projects.length;
  const completed = projects.filter((project) => project.status === "Completed");
  const completedWithDeadline = completed.filter((project) => project.deadline);
  const lateCompletions = completedWithDeadline.filter((project) => project.completedAfterDeadline).length;

  return {
    total,
    active: projects.filter((project) => project.status === "Active").length,
    completionRate: total ? Math.round((completed.length / total) * 100) : null,
    overdue: projects.filter((project) => getDeadlineState(project.deadline, project.status, today) === "overdue").length,
    lateCompletions,
    lateCompletionRate: completedWithDeadline.length ? Math.round((lateCompletions / completedWithDeadline.length) * 100) : null,
  };
}
