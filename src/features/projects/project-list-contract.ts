import {
  projectPriorities,
  projectStatuses,
  type ProjectPriority,
  type ProjectStatus,
} from "@/data/projects";

export { projectPriorities, projectStatuses };

export const projectSortOptions = [
  "updated-desc",
  "created-desc",
  "deadline-asc",
  "title-asc",
  "priority-desc",
] as const;
export type ProjectSort = (typeof projectSortOptions)[number];

export const deadlineFilters = ["any", "upcoming", "overdue", "none"] as const;
export type DeadlineFilter = (typeof deadlineFilters)[number];

export type ProjectListParams = {
  q: string;
  status: ProjectStatus[];
  priority: ProjectPriority[];
  deadline: DeadlineFilter;
  sort: ProjectSort;
  page: number;
};

type SearchParamValue = string | string[] | undefined;
type SearchParamRecord = Record<string, SearchParamValue> | URLSearchParams;

const first = (value: SearchParamValue) => (Array.isArray(value) ? value[0] : value);
const list = (value: SearchParamValue) => {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
};

function getValue(params: SearchParamRecord, key: string): SearchParamValue {
  return params instanceof URLSearchParams ? params.getAll(key) : params[key];
}

export function parseProjectListParams(
  params: SearchParamRecord,
): ProjectListParams {
  const q = (first(getValue(params, "q")) ?? "").trim();
  const statuses = list(getValue(params, "status")).filter(
    (value): value is ProjectStatus =>
      projectStatuses.includes(value as ProjectStatus),
  );
  const priorities = list(getValue(params, "priority")).filter(
    (value): value is ProjectPriority =>
      projectPriorities.includes(value as ProjectPriority),
  );
  const deadlineCandidate = first(getValue(params, "deadline"));
  const sortCandidate = first(getValue(params, "sort"));
  const pageCandidate = Number(first(getValue(params, "page")) ?? "1");

  return {
    q: q.length <= 200 ? q : "",
    status: [...new Set(statuses)],
    priority: [...new Set(priorities)],
    deadline: deadlineFilters.includes(deadlineCandidate as DeadlineFilter)
      ? (deadlineCandidate as DeadlineFilter)
      : "any",
    sort: projectSortOptions.includes(sortCandidate as ProjectSort)
      ? (sortCandidate as ProjectSort)
      : "updated-desc",
    page: Number.isInteger(pageCandidate) && pageCandidate > 0 ? pageCandidate : 1,
  };
}
