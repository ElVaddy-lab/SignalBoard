import { describe, expect, it } from "vitest";

import { calculateDashboardMetrics, getDeadlineState } from "./contracts";
import type { Project } from "@/data/projects";

const project = (overrides: Partial<Project>): Project => ({
  id: "project-1",
  title: "Website redesign",
  description: null,
  status: "Planning",
  priority: "Medium",
  projectLead: "Sarah Lee",
  deadline: null,
  completion: 0,
  createdAt: "2026-06-01T12:00:00.000Z",
  updatedAt: "2026-06-01T12:00:00.000Z",
  completedAt: null,
  completedAfterDeadline: false,
  ...overrides,
});

describe("Dashboard metric contract", () => {
  it("keeps undefined rates distinct from zero for an empty account", () => {
    expect(calculateDashboardMetrics([], new Date("2026-07-17T10:00:00Z"))).toEqual({
      total: 0,
      active: 0,
      completionRate: null,
      overdue: 0,
      lateCompletions: 0,
      lateCompletionRate: null,
    });
  });

  it("calculates completed, overdue, and late-completion measures independently", () => {
    const projects = [
      project({ id: "active-overdue", status: "Active", deadline: "2026-07-16" }),
      project({ id: "review-upcoming", status: "Review", deadline: "2026-07-20" }),
      project({ id: "completed-late", status: "Completed", deadline: "2026-07-10", completedAfterDeadline: true }),
      project({ id: "completed-on-time", status: "Completed", deadline: "2026-07-10" }),
      project({ id: "completed-no-date", status: "Completed" }),
    ];

    expect(calculateDashboardMetrics(projects, new Date("2026-07-17T10:00:00Z"))).toEqual({
      total: 5,
      active: 1,
      completionRate: 60,
      overdue: 1,
      lateCompletions: 1,
      lateCompletionRate: 50,
    });
  });

  it("classifies deadlines in the documented local-date windows", () => {
    const today = new Date("2026-07-17T10:00:00Z");
    expect(getDeadlineState("2026-07-16", "Active", today)).toBe("overdue");
    expect(getDeadlineState("2026-07-17", "Planning", today)).toBe("upcoming");
    expect(getDeadlineState("2026-07-31", "Review", today)).toBe("upcoming");
    expect(getDeadlineState("2026-08-01", "Review", today)).toBe("scheduled");
    expect(getDeadlineState("2026-07-16", "Completed", today)).toBe("completed");
    expect(getDeadlineState(null, "Active", today)).toBe("none");
  });
});
