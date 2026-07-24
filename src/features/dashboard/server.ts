"use server";

import type { Project, ProjectActivity, ProjectStatus } from "@/data/projects";
import { getAuthenticatedClaims } from "@/features/auth/server-session";
import { getTimezone } from "@/features/preferences/timezone";
import { getLocalDateInTimezone } from "@/features/preferences/timezone-contract";
import { createClient } from "@/lib/supabase/server";
import {
  mapActivityRecord,
  mapProjectRecord,
  type ActivityRecord,
  type ProjectRecord,
} from "@/features/projects/server/project-records";

export type DashboardData = {
  metrics: { total: number; active: number; completionRate: number | null; overdue: number; lateCompletions: number; lateCompletionRate: number | null };
  statusDistribution: Array<{ status: ProjectStatus; count: number }>;
  trend: Array<{ weekStart: string; count: number }>;
  upcoming: Project[];
  recentProjects: Project[];
  activity: ProjectActivity[];
};

const statuses: Record<string, ProjectStatus> = { planning: "Planning", active: "Active", review: "Review", completed: "Completed" };
type DistributionRow = { status: string; project_count: number };
type TrendRow = { week_start: string; completion_count: number };
type MetricsRow = { total_projects: number; active_projects: number; completion_rate: number | null; overdue_projects: number; late_completions: number; late_completion_rate: number | null };
type DashboardSnapshot = {
  metrics?: MetricsRow;
  status_distribution?: DistributionRow[];
  trend?: TrendRow[];
  upcoming?: Array<Omit<ProjectRecord, "description" | "created_at" | "updated_at">>;
  recent_projects?: ProjectRecord[];
  activity?: ActivityRecord[];
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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
  const upcomingRows = (upcomingResult.data ?? []) as Array<Omit<ProjectRecord, "description" | "created_at" | "updated_at">>;
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
    upcoming: upcomingRows.map((row) => mapProjectRecord({ ...row, description: null, created_at: "", updated_at: "" })),
    recentProjects: ((recentResult.data ?? []) as ProjectRecord[]).map(mapProjectRecord),
    activity: ((activityResult.data ?? []) as ActivityRecord[]).map(mapActivityRecord),
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
    upcoming: upcomingRows.map((row) => mapProjectRecord({ ...row, description: null, created_at: "", updated_at: "" })),
    recentProjects: (snapshot.recent_projects ?? []).map(mapProjectRecord),
    activity: (snapshot.activity ?? []).map(mapActivityRecord),
  };
}
