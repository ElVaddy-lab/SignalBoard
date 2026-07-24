import { z } from "zod";

import { projectPriorities, projectStatuses } from "@/data/projects";

export { projectPriorities, projectStatuses };
export {
  deadlineFilters,
  parseProjectListParams,
  projectSortOptions,
  type DeadlineFilter,
  type ProjectListParams,
  type ProjectSort,
} from "./project-list-contract";

const optionalTrimmedText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || undefined);

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

const optionalDeadline = z
  .union([
    z.literal(""),
    z.string().refine(isValidCalendarDate, "Use a valid calendar date"),
  ])
  .optional()
  .transform((value) => value || undefined);

export const createProjectSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title must be 100 characters or fewer"),
  description: optionalTrimmedText(1000),
  status: z.enum(projectStatuses).default("Planning"),
  priority: z.enum(projectPriorities).default("Medium"),
  projectLead: z.string().trim().min(2, "Project Lead must be at least 2 characters").max(80, "Project Lead must be 80 characters or fewer"),
  deadline: optionalDeadline,
});

export type ProjectInput = z.output<typeof createProjectSchema>;
