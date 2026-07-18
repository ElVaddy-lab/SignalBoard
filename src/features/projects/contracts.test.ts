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

  it("keeps past Deadlines valid so the UI can show a warning instead", () => {
    const result = createProjectSchema.safeParse({
      title: "Website redesign",
      projectLead: "Sarah Lee",
      deadline: "2024-01-01",
    });

    expect(result.success).toBe(true);
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
