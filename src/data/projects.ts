export const projectStatuses = ["Planning", "Active", "Review", "Completed"] as const;
export const projectPriorities = ["Low", "Medium", "High"] as const;

export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectPriority = (typeof projectPriorities)[number];

export type Project = {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  projectLead: string;
  deadline: string | null;
  completion: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  completedAfterDeadline: boolean;
};

export type ProjectActivityType = "created" | "updated" | "status_changed" | "deleted";

export type ProjectActivity = {
  id: string;
  projectId: string | null;
  projectTitle: string;
  type: ProjectActivityType;
  changedFields: string[];
  before?: string;
  after?: string;
  occurredAt: string;
};

const daysFrom = (date: Date, offset: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + offset);
  return result.toISOString().slice(0, 10);
};

const daysAgoTime = (date: Date, offset: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() - offset);
  result.setHours(10, 30, 0, 0);
  return result.toISOString();
};

/**
 * A local, intentionally explicit portfolio data set. The production loader
 * replaces this with the database-backed Sample Project Set.
 */
export function createSampleProjects(anchor = new Date()): Project[] {
  const records: Array<
    Omit<Project, "createdAt" | "updatedAt"> & { createdDaysAgo: number; updatedDaysAgo: number }
  > = [
    { id: "website-redesign", title: "Website Redesign", description: "Modernize the corporate website with stronger accessibility, content hierarchy, and responsive performance.", status: "Active", priority: "High", projectLead: "Sarah Lee", deadline: daysFrom(anchor, -3), completion: 72, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 76, updatedDaysAgo: 0 },
    { id: "mobile-app-launch", title: "Mobile App Launch", description: "Coordinate the final product release and launch communications for the mobile experience.", status: "Active", priority: "High", projectLead: "Mike Chen", deadline: daysFrom(anchor, -1), completion: 58, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 62, updatedDaysAgo: 1 },
    { id: "q2-marketing", title: "Q2 Marketing Campaign", description: "Deliver the campaign landing pages, messaging, and performance reporting for Q2.", status: "Review", priority: "Medium", projectLead: "Emma Davis", deadline: daysFrom(anchor, 0), completion: 40, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 47, updatedDaysAgo: 2 },
    { id: "data-dashboard", title: "Data Dashboard", description: "Design a usable reporting dashboard for product and revenue signals.", status: "Active", priority: "Medium", projectLead: "David Kim", deadline: daysFrom(anchor, 9), completion: 35, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 36, updatedDaysAgo: 3 },
    { id: "customer-portal", title: "Customer Portal", description: "Build a clear self-service portal for account information and support requests.", status: "Planning", priority: "Low", projectLead: "Lisa Patel", deadline: daysFrom(anchor, 13), completion: 18, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 28, updatedDaysAgo: 4 },
    { id: "api-integration", title: "API Integration", description: "Integrate the partner API with reliable error handling and reporting.", status: "Active", priority: "High", projectLead: "James Smith", deadline: daysFrom(anchor, 18), completion: 65, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 44, updatedDaysAgo: 5 },
    { id: "employee-onboarding", title: "Employee Onboarding Flow", description: "Simplify the onboarding flow and supporting documentation for new hires.", status: "Completed", priority: "Low", projectLead: "Olivia Brown", deadline: daysFrom(anchor, -26), completion: 100, completedAt: daysAgoTime(anchor, 18), completedAfterDeadline: false, createdDaysAgo: 92, updatedDaysAgo: 6 },
    { id: "security-audit", title: "Security Audit", description: "Complete a focused audit of critical application entry points.", status: "Active", priority: "High", projectLead: "Daniel Johnson", deadline: daysFrom(anchor, 21), completion: 30, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 34, updatedDaysAgo: 7 },
    { id: "saas-pricing", title: "SaaS Pricing Update", description: "Review packages and update pricing communication for the next release.", status: "Review", priority: "Medium", projectLead: "Priya Shah", deadline: daysFrom(anchor, 27), completion: 55, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 31, updatedDaysAgo: 8 },
    { id: "content-strategy", title: "Content Strategy Q2", description: "Create the Q2 editorial plan with priority topics and publication owners.", status: "Planning", priority: "Low", projectLead: "Noah Wilson", deadline: null, completion: 15, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 21, updatedDaysAgo: 9 },
    { id: "crm-migration", title: "CRM Migration", description: "Migrate current customer information to the updated CRM structure.", status: "Active", priority: "High", projectLead: "Rachel Adams", deadline: daysFrom(anchor, -2), completion: 25, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 64, updatedDaysAgo: 10 },
    { id: "analytics-enhancement", title: "Analytics Enhancement", description: "Add useful retention and conversion signals to product reporting.", status: "Active", priority: "Medium", projectLead: "Kevin Martinez", deadline: daysFrom(anchor, 8), completion: 45, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 39, updatedDaysAgo: 11 },
    { id: "design-system", title: "Design System Refresh", description: "Refresh the design system foundations, components, and documentation.", status: "Completed", priority: "Medium", projectLead: "Ava Thompson", deadline: daysFrom(anchor, -34), completion: 100, completedAt: daysAgoTime(anchor, 29), completedAfterDeadline: true, createdDaysAgo: 110, updatedDaysAgo: 12 },
    { id: "accessibility-pass", title: "Accessibility Pass", description: "Improve keyboard support, labels, and contrast across the core application.", status: "Completed", priority: "High", projectLead: "Mia Garcia", deadline: daysFrom(anchor, -42), completion: 100, completedAt: daysAgoTime(anchor, 49), completedAfterDeadline: false, createdDaysAgo: 121, updatedDaysAgo: 13 },
    { id: "billing-workflow", title: "Billing Workflow", description: "Document and improve the internal billing review workflow.", status: "Completed", priority: "Medium", projectLead: "Ethan Miller", deadline: daysFrom(anchor, -37), completion: 100, completedAt: daysAgoTime(anchor, 32), completedAfterDeadline: true, createdDaysAgo: 118, updatedDaysAgo: 14 },
    { id: "help-center", title: "Help Center Refresh", description: "Make key help content easier to find and keep current.", status: "Completed", priority: "Low", projectLead: "Sophia Clark", deadline: daysFrom(anchor, -45), completion: 100, completedAt: daysAgoTime(anchor, 47), completedAfterDeadline: false, createdDaysAgo: 133, updatedDaysAgo: 15 },
    { id: "partner-hub", title: "Partner Hub", description: "Define the first release of a central partner information hub.", status: "Planning", priority: "Medium", projectLead: "Lucas Anderson", deadline: daysFrom(anchor, 35), completion: 10, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 17, updatedDaysAgo: 16 },
    { id: "research-library", title: "Research Library", description: "Organize customer research into a searchable internal reference.", status: "Planning", priority: "Low", projectLead: "Grace Turner", deadline: null, completion: 5, completedAt: null, completedAfterDeadline: false, createdDaysAgo: 9, updatedDaysAgo: 17 },
  ];

  return records.map(({ createdDaysAgo, updatedDaysAgo, ...project }) => ({
    ...project,
    createdAt: daysAgoTime(anchor, createdDaysAgo),
    updatedAt: daysAgoTime(anchor, updatedDaysAgo),
  }));
}

export function createSampleActivity(anchor = new Date()): ProjectActivity[] {
  const at = (daysAgo: number, hours = 0) => {
    const result = new Date(anchor);
    result.setDate(result.getDate() - daysAgo);
    result.setHours(10 + hours, 15, 0, 0);
    return result.toISOString();
  };

  return [
    { id: "activity-1", projectId: "website-redesign", projectTitle: "Website Redesign", type: "updated", changedFields: ["description"], occurredAt: at(0) },
    { id: "activity-2", projectId: "mobile-app-launch", projectTitle: "Mobile App Launch", type: "status_changed", changedFields: ["status"], before: "Planning", after: "Active", occurredAt: at(1) },
    { id: "activity-3", projectId: "q2-marketing", projectTitle: "Q2 Marketing Campaign", type: "updated", changedFields: ["priority"], before: "Low", after: "Medium", occurredAt: at(2) },
    { id: "activity-4", projectId: "design-system", projectTitle: "Design System Refresh", type: "status_changed", changedFields: ["status"], before: "Review", after: "Completed", occurredAt: at(5) },
    { id: "activity-5", projectId: null, projectTitle: "Legacy Content Audit", type: "deleted", changedFields: [], occurredAt: at(7) },
    { id: "activity-6", projectId: "data-dashboard", projectTitle: "Data Dashboard", type: "created", changedFields: [], occurredAt: at(11) },
  ];
}
