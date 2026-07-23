"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Database, Json } from "@/types/database.generated";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectActivity, ProjectPriority, ProjectStatus } from "@/data/projects";
import { getAuthenticatedClaims } from "@/features/auth/server-session";
import { getTimezone } from "@/features/preferences/timezone";
import { getLocalDateInTimezone } from "@/features/preferences/timezone-contract";

import { createProjectSchema, parseProjectListParams, type ProjectInput } from "./contracts";

const idSchema = z.string().uuid();
const statusLabels: Record<string, ProjectStatus> = { planning: "Planning", active: "Active", review: "Review", completed: "Completed" };
const priorityLabels: Record<string, ProjectPriority> = { low: "Low", medium: "Medium", high: "High" };
type DatabaseStatus = Database["public"]["Enums"]["project_status"];
type DatabasePriority = Database["public"]["Enums"]["project_priority"];
const statusValues: Record<ProjectStatus, DatabaseStatus> = { Planning: "planning", Active: "active", Review: "review", Completed: "completed" };
const priorityValues: Record<ProjectPriority, DatabasePriority> = { Low: "low", Medium: "medium", High: "high" };
const visualCompletion: Record<ProjectStatus, number> = { Planning: 15, Active: 55, Review: 80, Completed: 100 };
const deadlineValues = { any: "all", upcoming: "upcoming", overdue: "overdue", none: "no_deadline" } as const;
const sortValues = { "updated-desc": "updated", "created-desc": "created", "deadline-asc": "deadline", "title-asc": "title", "priority-desc": "priority" } as const;

type ProjectRow = { id: string; title: string; description: string | null; status: string; priority: string; project_lead: string; deadline: string | null; created_at: string; updated_at: string };
type ActivityRow = { id: string; project_id: string | null; project_title: string; activity_type: string; changed_fields: string[]; changes: Json; occurred_at: string };

function mapProject(row: ProjectRow): Project {
  const status = statusLabels[row.status] ?? "Planning";
  return { id: row.id, title: row.title, description: row.description, status, priority: priorityLabels[row.priority] ?? "Medium", projectLead: row.project_lead, deadline: row.deadline, completion: visualCompletion[status], createdAt: row.created_at, updatedAt: row.updated_at, completedAt: null, completedAfterDeadline: false };
}

function valuePair(changes: Json, field: string): { before?: string; after?: string } {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return {};
  const candidate = changes[field];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return {};
  const before = candidate.before;
  const after = candidate.after;
  return { before: typeof before === "string" ? before : undefined, after: typeof after === "string" ? after : undefined };
}

function mapActivity(row: ActivityRow): ProjectActivity {
  const normalized = row.changed_fields.map((field) => field === "project_lead" ? "projectLead" : field);
  const primary = row.changed_fields.find((field) => ["status", "priority", "project_lead", "deadline"].includes(field));
  const pair = primary ? valuePair(row.changes, primary) : {};
  return { id: row.id, projectId: row.project_id, projectTitle: row.project_title, type: row.activity_type as ProjectActivity["type"], changedFields: normalized, ...pair, occurredAt: row.occurred_at };
}

async function requireUser() {
  const claims = await getAuthenticatedClaims();
  if (!claims) throw new Error("You must be signed in to manage Projects.");
  const supabase = await createClient();
  return supabase;
}

export async function getProjectsPage(rawParams: Record<string, string | string[] | undefined>) {
  const params = parseProjectListParams(rawParams);
  const supabase = await requireUser();
  const timezone = await getTimezone();
  const { data, error } = await supabase.rpc("list_projects", {
    p_query: params.q || undefined,
    p_status: params.status.map((status) => statusValues[status]),
    p_priority: params.priority.map((priority) => priorityValues[priority]),
    p_deadline: deadlineValues[params.deadline],
    p_local_date: getLocalDateInTimezone(timezone),
    p_sort: sortValues[params.sort],
    p_page: params.page,
    p_page_size: 12,
  });
  if (error) throw new Error("We couldn\u2019t load your Projects.");
  const rows = (data ?? []) as Array<ProjectRow & { total_count: number }>;
  return { params, projects: rows.map(mapProject), totalCount: Number(rows[0]?.total_count ?? 0), timezone };
}

export async function getProjectDetail(id: string) {
  const projectId = idSchema.parse(id);
  const supabase = await requireUser();
  const [{ data: projectRow, error: projectError }, { data: activityRows, error: activityError }] = await Promise.all([
    supabase.from("projects").select("id,title,description,status,priority,project_lead,deadline,created_at,updated_at").eq("id", projectId).maybeSingle(),
    supabase.from("project_activities").select("id,project_id,project_title,activity_type,changed_fields,changes,occurred_at").eq("project_id", projectId).order("occurred_at", { ascending: false }),
  ]);
  if (projectError) throw new Error("We couldn\u2019t load this Project.");
  if (activityError) throw new Error("We couldn\u2019t load Project Activity.");
  return { project: projectRow ? mapProject(projectRow as ProjectRow) : null, activity: ((activityRows ?? []) as ActivityRow[]).map(mapActivity) };
}

export async function createProjectAction(input: ProjectInput) {
  const values = createProjectSchema.parse(input);
  const supabase = await requireUser();
  const { error } = await supabase.from("projects").insert({ title: values.title, description: values.description ?? null, status: statusValues[values.status], priority: priorityValues[values.priority], project_lead: values.projectLead, deadline: values.deadline ?? null });
  if (error) throw new Error("We couldn\u2019t create this Project.");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}

export async function updateProjectAction(id: string, input: ProjectInput) {
  const projectId = idSchema.parse(id);
  const values = createProjectSchema.parse(input);
  const supabase = await requireUser();
  const { error } = await supabase.from("projects").update({ title: values.title, description: values.description ?? null, status: statusValues[values.status], priority: priorityValues[values.priority], project_lead: values.projectLead, deadline: values.deadline ?? null }).eq("id", projectId);
  if (error) throw new Error("We couldn\u2019t save this Project.");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectAction(id: string) {
  const projectId = idSchema.parse(id);
  const supabase = await requireUser();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error("We couldn\u2019t delete this Project.");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}

export async function toggleSampleProjectsAction() {
  const supabase = await requireUser();
  const { data, error } = await supabase.rpc("toggle_sample_project_set");
  if (error) throw new Error("We couldn\u2019t load Sample Data.");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  const result = data?.[0];
  return {
    enabled: Boolean(result?.enabled),
    affectedCount: Number(result?.affected_count ?? 0),
    totalProjects: Number(result?.total_projects ?? 0),
  };
}
