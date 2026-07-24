import { describe, expect, it } from "vitest";

import {
  mapActivityRecord,
  mapProjectRecord,
  type ActivityRecord,
  type ProjectRecord,
} from "./project-records";

const projectRecord = (changes: Partial<ProjectRecord> = {}): ProjectRecord => ({
  id: "89c6dbd8-504c-4708-98c7-c48b5d0c8312",
  title: "Launch review",
  description: null,
  status: "active",
  priority: "high",
  project_lead: "Mia Garcia",
  deadline: null,
  created_at: "2026-07-01T09:00:00.000Z",
  updated_at: "2026-07-24T09:00:00.000Z",
  ...changes,
});

const activityRecord = (changes: Partial<ActivityRecord> = {}): ActivityRecord => ({
  id: "1659f5f8-b3de-40b8-b2db-308bcceec5f6",
  project_id: "89c6dbd8-504c-4708-98c7-c48b5d0c8312",
  project_title: "Launch review",
  activity_type: "status_changed",
  changed_fields: ["status"],
  changes: { status: { before: "active", after: "completed" } },
  occurred_at: "2026-07-24T10:00:00.000Z",
  ...changes,
});

describe("project database record mapping", () => {
  it("preserves nullable deadlines and maps visual completion", () => {
    expect(mapProjectRecord(projectRecord())).toMatchObject({
      deadline: null,
      status: "Active",
      priority: "High",
      completion: 55,
      completedAt: null,
      completedAfterDeadline: false,
    });

    expect(mapProjectRecord(projectRecord({ status: "completed" }))).toMatchObject({
      status: "Completed",
      completion: 100,
      completedAfterDeadline: false,
    });
  });

  it("uses safe domain fallbacks for invalid runtime enum values", () => {
    expect(
      mapProjectRecord(projectRecord({ status: "archived", priority: "urgent" })),
    ).toMatchObject({
      status: "Planning",
      priority: "Medium",
      completion: 15,
    });
  });
});

describe("project activity record mapping", () => {
  it("normalizes changed fields and extracts the primary value pair", () => {
    expect(
      mapActivityRecord(
        activityRecord({
          changed_fields: ["project_lead"],
          changes: {
            project_lead: { before: "Mia Garcia", after: "Ava Thompson" },
          },
        }),
      ),
    ).toMatchObject({
      type: "status_changed",
      changedFields: ["projectLead"],
      before: "Mia Garcia",
      after: "Ava Thompson",
    });
  });

  it("preserves deleted Project Activity and tolerates invalid runtime types", () => {
    expect(
      mapActivityRecord(
        activityRecord({
          project_id: null,
          activity_type: "deleted",
          changed_fields: [],
          changes: {},
        }),
      ),
    ).toMatchObject({
      projectId: null,
      type: "deleted",
      changedFields: [],
    });

    expect(mapActivityRecord(activityRecord({ activity_type: "restored" })).type).toBe(
      "updated",
    );
  });
});
