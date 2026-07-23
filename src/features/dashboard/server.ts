"use server";

import type { Project, ProjectActivity, ProjectPriority, ProjectStatus } from "@/data/projects";
import { getAuthenticatedClaims } from "@/features/auth/server-session";
import { getTimezone } from "@/features/preferences/timezone";
import { getLocalDateInTimezone } from "@/features/preferences/timezone-contract";
import type { Json } from "@/types/database.generated";
import { createClient } from "@/lib/supabase/server";

export type DashboardData = {
  metrics: { total: number; active: number; completionRate: number | null; overdue: number; lateCompletions: number; lateCompletionRate: number | null };
  statusDistribution: Array<{ status: ProjectStatus; count: number }>;
  trend: Array<{ weekStart: string; count: number }>;
  upcoming: Project[];
  recentProjects: Project[];
  activity: ProjectActivity[];
};

const statuses: Record<string, ProjectStatus> = { planning: "Planning", active: "Active", review: "Review", completed: "Completed" };
const priorities: Record<string, ProjectPriority> = { low: "Low", medium: "Medium", high: "High" };
const visualCompletion: Record<ProjectStatus, number> = { Planning: 15, Active: 55, Review: 80, Completed: 100 };
type ProjectRow = { id: string; title: string; description: string | null; status: string; priority: string; project_lead: string; deadline: string | null; created_at: string; updated_at: string };
type ActivityRow = { id: string; project_id: string | null; project_title: string; activity_type: string; changed_fields: string[]; changes: Json; occurred_at: string };
type DistributionRow = { status: string; project_count: number };
type TrendRow = { week_start: string; completion_count: number };
type MetricsRow = { total_projects: number; active_projects: number; completion_rate: number | null; overdue_projects: number; late_completions: number; late_completion_rate: number | null };
type DashboardSnapshot = {
  metrics?: MetricsRow;
  status_distribution?: DistributionRow[];
  trend?: TrendRow[];
  upcoming?: Array<Omit<ProjectRow, "description" | "created_at" | "updated_at">>;
  recent_projects?: ProjectRow[];
  activity?: ActivityRow[];
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const mapProject = (row: ProjectRow): Project => {
  const status = statuses[row.status] ?? "Planning";
  return { id: row.id, title: row.title, description: row.description, status, priority: priorities[row.priority] ?? "Medium", projectLead: row.project_lead, deadline: row.deadline, completion: visualCompletion[status], createdAt: row.created_at, updatedAt: row.updated_at, completedAt: null, completedAfterDeadline: false };
};

const mapActivity = (row: ActivityRow): ProjectActivity => {
  const changedFields = row.changed_fields.map((field) => field === "project_lead" ? "projectLead" : field);
  const target = row.changed_fields.find((field) => ["status", "priority", "project_lead", "deadline"].includes(field));
  const changes = row.changes && typeof row.changes === "object" && !Array.isArray(row.changes) && target ? row.changes[target] : null;
  const pair = changes && typeof changes === "object" && !Array.isArray(changes) ? { before: typeof changes.before === "string" ? changes.before : undefined, after: typeof changes.after === "string" ? changes.after : undefined } : {};
  return { id: row.id, projectId: row.project_id, projectTitle: row.project_title, type: row.activity_type as ProjectActivity["type"], changedFields, ...pair, occurredAt: row.occurred_at };
};

function isMissingSnapshotFunction(error: { code?: string; message?: string }) {
  return error.code === "PGRST202" || error.message?.includes("get_dashboard_snapshot") === true;
}

async function getLegacyDashboardData(supabase: SupabaseClient, timezone: string, localDate?: string): Promise<DashboardData> {
  const [metricsResult, distributionResult, trendResult, upcomingResult, recentResult, activityResult] = await Promise.all([
    supabase.rpc("get_dashboard_metrics", { p_timezone: timezone, p_local_date: localDate }),
    supabase.rpc("get_status_distribution"),
    supabase.rpc("get_completion_trend", { p_timezone: timezone }),
    supabase.rpc("get_upcoming_deadlines", { p_local_date: localDate }),
    supabase.from("projects").select("id,title,description,status,priority,project_lead,deadline,created_at,updated_at").order("updated_at", { ascending: false }).limit(5),
    supabase.from("project_activities").select("id,project_id,project_title,activity_type,changed_fields,changes,occurred_at").order("occurred_at", { ascending: false }).limit(8),
  ]);

  const error = metricsResult.error ?? distributionResult.error ?? trendResult.error ?? upcomingResult.error ?? recentResult.error ?? activityResult.error;
  if (error) throw new Error("We couldn\u2019t load your Dashboard.");

  const metrics = metricsResult.data?.[0];
  const upcomingRows = (upcomingResult.data ?? []) as Array<Omit<ProjectRow, "description" | "created_at" | "updated_at">>;
  return {
    metrics: {
      total: Number(metrics?.total_projects ?? 0),
      active: Number(metrics?.active_projects ?? 0),
      completionRate: metrics?.completion_rate == null ? null : Number(metrics.completion_rate),
      overdue: Number(metrics?.overdue_projects ?? 0),
      lateCompletions: Number(metrics?.late_completions ?? 0),
      lateCompletionRate: metrics?.late_completion_rate == null ? null : Number(metrics.late_completion_rate),
    },
    statusDistribution: ((distributionResult.data ?? []) as DistributionRow[]).map((item) => ({ status: statuses[item.status] ?? "Planning", count: Number(item.project_count) })),
    trend: ((trendResult.data ?? []) as TrendRow[]).map((item) => ({ weekStart: item.week_start, count: Number(item.completion_count) })),
    upcoming: upcomingRows.map((row) => mapProject({ ...row, description: null, created_at: "", updated_at: "" })),
    recentProjects: ((recentResult.data ?? []) as ProjectRow[]).map(mapProject),
    activity: ((activityResult.data ?? []) as ActivityRow[]).map(mapActivity),
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const claims = await getAuthenticatedClaims();
  if (!claims) throw new Error("You must be signed in to view the Dashboard.");
  const supabase = await createClient();
  const timezone = await getTimezone();
  const localDate = getLocalDateInTimezone(timezone);
  const { data, error } = await supabase.rpc("get_dashboard_snapshot", {
    p_timezone: timezone,
    p_local_date: localDate,
  });
  if (error) {
    if (isMissingSnapshotFunction(error)) return getLegacyDashboardData(supabase, timezone, localDate);
    throw new Error("We couldn\u2019t load your Dashboard.");
  }
  const snapshot = (data ?? {}) as DashboardSnapshot;
  const metrics = snapshot.metrics;
  const upcomingRows = snapshot.upcoming ?? [];
  return {
    metrics: { total: Number(metrics?.total_projects ?? 0), active: Number(metrics?.active_projects ?? 0), completionRate: metrics?.completion_rate == null ? null : Number(metrics.completion_rate), overdue: Number(metrics?.overdue_projects ?? 0), lateCompletions: Number(metrics?.late_completions ?? 0), lateCompletionRate: metrics?.late_completion_rate == null ? null : Number(metrics.late_completion_rate) },
    statusDistribution: (snapshot.status_distribution ?? []).map((item) => ({ status: statuses[item.status] ?? "Planning", count: Number(item.project_count) })),
    trend: (snapshot.trend ?? []).map((item) => ({ weekStart: item.week_start, count: Number(item.completion_count) })),
    upcoming: upcomingRows.map((row) => mapProject({ ...row, description: null, created_at: "", updated_at: "" })),
    recentProjects: (snapshot.recent_projects ?? []).map(mapProject),
    activity: (snapshot.activity ?? []).map(mapActivity),
  };
}
