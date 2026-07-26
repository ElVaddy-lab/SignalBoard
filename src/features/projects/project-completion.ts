import type { ProjectStatus } from "./project-status";

export const projectCompletionByStatus = {
  Planning: 15,
  Active: 55,
  Review: 80,
  Completed: 100,
} as const satisfies Record<ProjectStatus, number>;

export function getCompletionForStatus(status: ProjectStatus): number {
  return projectCompletionByStatus[status];
}
