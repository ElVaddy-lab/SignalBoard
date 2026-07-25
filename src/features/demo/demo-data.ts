import {
  createSampleActivity,
  createSampleProjects,
  projectStatuses,
  type Project,
  type ProjectActivity,
  type ProjectPriority,
} from "@/data/projects";
import { calculateDashboardMetrics, getDeadlineState } from "@/features/dashboard/contracts";
import type { DashboardData } from "@/features/dashboard/server";
import type { ProjectListParams } from "@/features/projects/project-list-contract";

export const DEMO_PAGE_SIZE = 8;

export type DemoSnapshot = {
  anchorDate: string;
  projects: Project[];
  activity: ProjectActivity[];
};

export function createDemoSnapshot(anchor = new Date()): DemoSnapshot {
  const stableAnchor = new Date(anchor);
  stableAnchor.setHours(12, 0, 0, 0);

  return {
    anchorDate: stableAnchor.toISOString().slice(0, 10),
    projects: createSampleProjects(stableAnchor),
    activity: createSampleActivity(stableAnchor),
  };
}

export function listDemoProjects(params: ProjectListParams, anchor = new Date()) {
  const { projects } = createDemoSnapshot(anchor);
  const query = params.q.toLocaleLowerCase();
  const priorityRank: Record<ProjectPriority, number> = { Low: 1, Medium: 2, High: 3 };
  const filtered = projects.filter((project) => {
    const matchesQuery =
      !query ||
      [project.title, project.description, project.projectLead]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase().includes(query));
    const matchesStatus = !params.status.length || params.status.includes(project.status);
    const matchesPriority =
      !params.priority.length || params.priority.includes(project.priority);
    const deadlineState = getDeadlineState(project.deadline, project.status, anchor);
    const matchesDeadline =
      params.deadline === "any" ||
      (params.deadline === "none" && deadlineState === "none") ||
      params.deadline === deadlineState;
    return matchesQuery && matchesStatus && matchesPriority && matchesDeadline;
  });

  filtered.sort((left, right) => {
    if (params.sort === "created-desc") return right.createdAt.localeCompare(left.createdAt);
    if (params.sort === "deadline-asc") {
      return (left.deadline ?? "9999-12-31").localeCompare(right.deadline ?? "9999-12-31");
    }
    if (params.sort === "title-asc") return left.title.localeCompare(right.title);
    if (params.sort === "priority-desc") {
      return priorityRank[right.priority] - priorityRank[left.priority];
    }
    return right.updatedAt.localeCompare(left.updatedAt);
  });

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / DEMO_PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const offset = (page - 1) * DEMO_PAGE_SIZE;
  return {
    page,
    projects: filtered.slice(offset, offset + DEMO_PAGE_SIZE),
    totalCount,
    totalPages,
  };
}

export function getDemoProject(id: string, anchor = new Date()) {
  const snapshot = createDemoSnapshot(anchor);
  const project = snapshot.projects.find((item) => item.id === id);
  if (!project) return null;
  return {
    project,
    activity: snapshot.activity.filter((item) => item.projectId === id),
  };
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
}

export function getDemoDashboardData(anchor = new Date()): DashboardData {
  const snapshot = createDemoSnapshot(anchor);
  const projects = snapshot.projects;
  const week = startOfWeek(anchor);
  const trend = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(week);
    start.setDate(start.getDate() - (11 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {
      weekStart: start.toISOString().slice(0, 10),
      count: projects.filter((project) => {
        if (!project.completedAt) return false;
        const completedAt = new Date(project.completedAt);
        return completedAt >= start && completedAt < end;
      }).length,
    };
  });

  return {
    metrics: calculateDashboardMetrics(projects, anchor),
    statusDistribution: projectStatuses.map((status) => ({
      status,
      count: projects.filter((project) => project.status === status).length,
    })),
    trend,
    upcoming: projects
      .filter((project) => {
        const state = getDeadlineState(project.deadline, project.status, anchor);
        return state === "overdue" || state === "upcoming";
      })
      .sort((left, right) => (left.deadline ?? "").localeCompare(right.deadline ?? ""))
      .slice(0, 5),
    recentProjects: [...projects]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 5),
    activity: snapshot.activity.slice(0, 8),
  };
}
