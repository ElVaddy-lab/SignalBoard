import type { ProjectActivity } from "@/data/projects";

export function activityMessageKey(activity: ProjectActivity) {
  if (activity.type === "created") return "created";
  if (activity.type === "deleted") return "deleted";
  if (activity.type === "status_changed") return "statusChanged";
  const field = activity.changedFields[0];
  if (field === "priority") return "priorityChanged";
  if (field === "deadline") return "deadlineChanged";
  if (field === "projectLead") return "projectLeadChanged";
  if (field === "description") return "descriptionUpdated";
  return "projectUpdated";
}
