import "server-only";

import type {
  Project,
  ProjectActivity,
  ProjectActivityType,
  ProjectPriority,
  ProjectStatus,
} from "@/data/projects";
import type { Database, Json } from "@/types/database.generated";

import { getCompletionForStatus } from "../project-completion";

type ProjectDatabaseRow = Database["public"]["Tables"]["projects"]["Row"];
type ActivityDatabaseRow = Database["public"]["Tables"]["project_activities"]["Row"];

export type ProjectRecord = Omit<
  Pick<
    ProjectDatabaseRow,
    | "id"
    | "title"
    | "description"
    | "project_lead"
    | "deadline"
    | "created_at"
    | "updated_at"
  >,
  never
> & {
  priority: string;
  status: string;
};

export type ActivityRecord = Omit<
  Pick<
    ActivityDatabaseRow,
    | "id"
    | "project_id"
    | "project_title"
    | "changed_fields"
    | "changes"
    | "occurred_at"
  >,
  never
> & {
  activity_type: string;
};

const statusLabels: Record<string, ProjectStatus> = {
  planning: "Planning",
  active: "Active",
  review: "Review",
  completed: "Completed",
};

const priorityLabels: Record<string, ProjectPriority> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const activityTypes = new Set<ProjectActivityType>([
  "created",
  "updated",
  "status_changed",
  "deleted",
]);

function valuePair(changes: Json, field: string): { before?: string; after?: string } {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return {};
  const candidate = changes[field];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return {};
  return {
    before: typeof candidate.before === "string" ? candidate.before : undefined,
    after: typeof candidate.after === "string" ? candidate.after : undefined,
  };
}

export function mapProjectRecord(row: ProjectRecord): Project {
  const status = statusLabels[row.status] ?? "Planning";

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status,
    priority: priorityLabels[row.priority] ?? "Medium",
    projectLead: row.project_lead,
    deadline: row.deadline,
    completion: getCompletionForStatus(status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: null,
    completedAfterDeadline: false,
  };
}

export function mapActivityRecord(row: ActivityRecord): ProjectActivity {
  const changedFields = row.changed_fields.map((field) =>
    field === "project_lead" ? "projectLead" : field,
  );
  const primaryField = row.changed_fields.find((field) =>
    ["status", "priority", "project_lead", "deadline"].includes(field),
  );
  const type = activityTypes.has(row.activity_type as ProjectActivityType)
    ? (row.activity_type as ProjectActivityType)
    : "updated";

  return {
    id: row.id,
    projectId: row.project_id,
    projectTitle: row.project_title,
    type,
    changedFields,
    ...(primaryField ? valuePair(row.changes, primaryField) : {}),
    occurredAt: row.occurred_at,
  };
}
