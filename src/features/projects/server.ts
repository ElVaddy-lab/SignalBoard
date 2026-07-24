"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Database } from "@/types/database.generated";
import { createClient } from "@/lib/supabase/server";
import type { ProjectPriority, ProjectStatus } from "@/data/projects";
import { getAuthenticatedClaims } from "@/features/auth/server-session";
import { getTimezone } from "@/features/preferences/timezone";
import { getLocalDateInTimezone } from "@/features/preferences/timezone-contract";

import { createProjectSchema, type ProjectInput } from "./contracts";
import { parseProjectListParams } from "./project-list-contract";
import {
  mapActivityRecord,
  mapProjectRecord,
  type ActivityRecord,
  type ProjectRecord,
} from "./server/project-records";

const idSchema = z.string().uuid();
type DatabaseStatus = Database["public"]["Enums"]["project_status"];
type DatabasePriority = Database["public"]["Enums"]["project_priority"];
const statusValues: Record<ProjectStatus, DatabaseStatus> = { Planning: "planning", Active: "active", Review: "review", Completed: "completed" };
const priorityValues: Record<ProjectPriority, DatabasePriority> = { Low: "low", Medium: "medium", High: "high" };
const deadlineValues = { any: "all", upcoming: "upcoming", overdue: "overdue", none: "no_deadline" } as const;
const sortValues = { "updated-desc": "updated", "created-desc": "created", "deadline-asc": "deadline", "title-asc": "title", "priority-desc": "priority" } as const;

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
  const rows = (data ?? []) as Array<ProjectRecord & { total_count: number }>;
  return { params, projects: rows.map(mapProjectRecord), totalCount: Number(rows[0]?.total_count ?? 0), timezone };
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
  return {
    project: projectRow ? mapProjectRecord(projectRow as ProjectRecord) : null,
    activity: ((activityRows ?? []) as ActivityRecord[]).map(mapActivityRecord),
  };
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
