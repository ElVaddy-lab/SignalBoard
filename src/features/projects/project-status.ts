export const projectStatuses = [
  "Planning",
  "Active",
  "Review",
  "Completed",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];
