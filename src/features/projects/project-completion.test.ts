import { describe, expect, it } from "vitest";

import { createSampleProjects } from "@/data/projects";

import {
  getCompletionForStatus,
  projectCompletionByStatus,
} from "./project-completion";

describe("Project completion contract", () => {
  it.each([
    ["Planning", 15],
    ["Active", 55],
    ["Review", 80],
    ["Completed", 100],
  ] as const)("maps %s Projects to %i%% completion", (status, completion) => {
    expect(projectCompletionByStatus[status]).toBe(completion);
    expect(getCompletionForStatus(status)).toBe(completion);
  });

  it("keeps every deterministic Demo fixture consistent with its status", () => {
    const projects = createSampleProjects(new Date("2026-07-24T12:00:00Z"));

    for (const project of projects) {
      expect(project.completion, project.id).toBe(
        getCompletionForStatus(project.status),
      );
    }
  });
});
