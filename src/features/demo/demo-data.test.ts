import { describe, expect, it } from "vitest";

import {
  createDemoSnapshot,
  getDemoDashboardData,
  getDemoProject,
  listDemoProjects,
} from "./demo-data";
import { getDeadlineState } from "@/features/dashboard/contracts";

const anchor = new Date("2026-07-24T12:00:00Z");

describe("public demo data", () => {
  it("builds a deterministic, populated snapshot without external data", () => {
    const first = createDemoSnapshot(anchor);
    const second = createDemoSnapshot(anchor);

    expect(second).toEqual(first);
    expect(first.projects).toHaveLength(18);
    expect(first.projects.map((project) => project.id)).toContain("website-redesign");
    expect(first.activity.some((item) => item.projectId === null && item.type === "deleted")).toBe(true);
  });

  it("filters, sorts, and paginates through the public query seam", () => {
    const result = listDemoProjects(
      { deadline: "overdue", page: 1, priority: ["High"], q: "", sort: "deadline-asc", status: [] },
      anchor,
    );

    expect(result.totalCount).toBe(3);
    expect(result.projects.map((project) => project.id)).toEqual([
      "website-redesign",
      "crm-migration",
      "mobile-app-launch",
    ]);
  });

  it("keeps a today deadline in the upcoming demo slice without marking it overdue", () => {
    const snapshot = createDemoSnapshot(anchor);
    const todayProject = snapshot.projects.find((project) => project.id === "q2-marketing");
    const dashboard = getDemoDashboardData(anchor);

    expect(todayProject?.deadline).toBe(snapshot.anchorDate);
    expect(todayProject && getDeadlineState(todayProject.deadline, todayProject.status, anchor)).toBe("upcoming");
    expect(dashboard.upcoming.map((project) => project.id)).toContain("q2-marketing");
    expect(dashboard.metrics.overdue).toBe(3);
  });

  it("returns detail only for stable demo ids", () => {
    expect(getDemoProject("website-redesign", anchor)?.project.title).toBe("Website Redesign");
    expect(getDemoProject("missing-project", anchor)).toBeNull();
  });

  it("projects dashboard analytics from the same fixture snapshot", () => {
    const dashboard = getDemoDashboardData(anchor);

    expect(dashboard.metrics.total).toBe(18);
    expect(dashboard.metrics.overdue).toBe(3);
    expect(dashboard.statusDistribution.reduce((sum, item) => sum + item.count, 0)).toBe(18);
    expect(dashboard.trend).toHaveLength(12);
  });
});
