import { describe, expect, it } from "vitest";

import {
  createProjectSchema,
  parseProjectListParams,
  projectPriorities,
  projectStatuses,
} from "./contracts";

describe("Project validation contract", () => {
  it("trims accepted Project values and applies the approved defaults", () => {
    const parsed = createProjectSchema.parse({
      title: "  Website redesign  ",
      description: "  Refresh the public website.  ",
      projectLead: "  Sarah Lee  ",
    });

    expect(parsed).toEqual({
      title: "Website redesign",
      description: "Refresh the public website.",
      projectLead: "Sarah Lee",
      status: "Planning",
      priority: "Medium",
      deadline: undefined,
    });
  });

  it.each([
    ["title", { title: "No", projectLead: "Sarah Lee" }],
    ["project lead", { title: "Website redesign", projectLead: "S" }],
    ["description", { title: "Website redesign", projectLead: "Sarah Lee", description: "x".repeat(1001) }],
  ])("rejects an invalid %s", (_field, value) => {
    expect(createProjectSchema.safeParse(value).success).toBe(false);
  });

  it.each([
    ["past", "2024-01-01"],
    ["current", "2026-07-23"],
    ["future", "2035-12-31"],
    ["leap-day", "2028-02-29"],
  ])("keeps a valid %s Deadline", (_case, deadline) => {
    const result = createProjectSchema.safeParse({
      title: "Website redesign",
      projectLead: "Sarah Lee",
      deadline,
    });

    expect(result.success).toBe(true);
  });

  it.each([
    ["impossible day", "2026-02-31"],
    ["non-leap day", "2025-02-29"],
    ["invalid month", "2026-13-01"],
    ["zero day", "2026-01-00"],
    ["year zero", "0000-01-01"],
    ["invalid shape", "23-07-2026"],
  ])("rejects an %s at the server validation boundary", (_case, deadline) => {
    const result = createProjectSchema.safeParse({
      title: "Website redesign",
      projectLead: "Sarah Lee",
      deadline,
    });

    expect(result.success).toBe(false);
  });

  it("exports only the approved lifecycle and priority values", () => {
    expect(projectStatuses).toEqual(["Planning", "Active", "Review", "Completed"]);
    expect(projectPriorities).toEqual(["Low", "Medium", "High"]);
  });
});

describe("Projects URL contract", () => {
  it("normalizes a valid URL query into the server-listing contract", () => {
    expect(
      parseProjectListParams({
        q: " redesign ",
        status: ["Active", "Review"],
        priority: "High",
        deadline: "upcoming",
        sort: "title-asc",
        page: "2",
      }),
    ).toEqual({
      q: "redesign",
      status: ["Active", "Review"],
      priority: ["High"],
      deadline: "upcoming",
      sort: "title-asc",
      page: 2,
    });
  });

  it("drops unsafe values and falls back to the first recently-updated page", () => {
    expect(
      parseProjectListParams({
        q: "x".repeat(201),
        status: "Owner",
        priority: "Urgent",
        deadline: "tomorrow",
        sort: "delete",
        page: "-9",
      }),
    ).toEqual({
      q: "",
      status: [],
      priority: [],
      deadline: "any",
      sort: "updated-desc",
      page: 1,
    });
  });
});
