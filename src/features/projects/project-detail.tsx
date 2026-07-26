import { ArrowLeft, CalendarDays, Clock3, UserRound } from "lucide-react";
import Link from "next/link";
import { createTranslator } from "next-intl";

import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Project, ProjectActivity } from "@/data/projects";
import { activityMessageKey } from "@/features/activity/contracts";
import { getLocale } from "@/features/preferences/locale";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

import { Priority, Status } from "./project-badges";
import { ProjectDetailActions } from "./project-detail-actions";
import { deadlineLabel, formatDate, formatDateTime } from "./project-presentation";
import styles from "./projects.module.css";

export async function ProjectDetail({ activity, project }: { activity: ProjectActivity[]; project: Project }) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "projects" });
  const common = createTranslator({ locale, messages, namespace: "common" });
  const activityT = createTranslator({ locale, messages, namespace: "activity" });
  const deadlineLabels = { none: t("noDeadline"), overdue: t("overdue"), upcoming: t("upcoming"), completed: t("completed"), scheduled: t("scheduled") };
  const currentDeadlineLabel = deadlineLabel(project, deadlineLabels);

  return <div className={styles.projectDetail}>
    <Link className={styles.backLink} href="/projects"><ArrowLeft aria-hidden="true" size={18} />{common("backToProjects")}</Link>
    <header className={styles.detailHeader}><div><h1>{project.title}</h1><div className={styles.detailBadges}><Status label={t(`statusValues.${project.status}`)} value={project.status} /><Priority label={t(`priorityValues.${project.priority}`)} value={project.priority} /></div></div><ProjectDetailActions project={project} /></header>
    <div className={styles.detailGrid}><Panel className={styles.overviewPanel}><h2>{t("projectOverview")}</h2><p className={styles.description}>{project.description ?? t("noDescription")}</p><div className={styles.detailCompletion}><span>{t("completion")}</span><b>{project.completion}%</b><ProgressBar ariaLabel={t("completionPercent", { value: project.completion })} className={styles.detailProgressTrack} value={project.completion} /></div><dl className={styles.metadataGrid}><Metadata icon={<UserRound aria-hidden="true" size={24} />} label={t("projectLead")} value={project.projectLead} /><Metadata icon={<CalendarDays aria-hidden="true" size={24} />} label={t("deadline")} value={<><span>{formatDate(project.deadline, locale, deadlineLabels.none)}</span><small className={currentDeadlineLabel === deadlineLabels.overdue ? styles.overdueText : undefined}>{currentDeadlineLabel}</small></>} /><Metadata icon={<CalendarDays aria-hidden="true" size={24} />} label={t("created")} value={formatDate(project.createdAt.slice(0, 10), locale, deadlineLabels.none)} /><Metadata icon={<Clock3 aria-hidden="true" size={24} />} label={t("updated")} value={formatDateTime(project.updatedAt, locale)} /></dl></Panel><ActivityTimeline activity={activity} deletedDescription={activityT("deletedDescription")} locale={locale} messages={activity.map((event) => activityT(activityMessageKey(event)))} noneLabel={activityT("none")} title={t("activityTimeline")} /></div>
  </div>;
}

function Metadata({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) { return <div><dt>{icon}<span>{label}</span></dt><dd>{value}</dd></div>; }

function ActivityTimeline({ activity, deletedDescription, locale, messages, noneLabel, title }: { activity: ProjectActivity[]; deletedDescription: string; locale: AppLocale; messages: string[]; noneLabel: string; title: string }) {
  return <Panel className={styles.activityPanel}><h2>{title}</h2><ol className={styles.activityTimeline}>{activity.length ? activity.map((event, index) => <li key={event.id}><span className={`${styles.activityIcon} ${styles[event.type]}`}>{event.type === "created" ? "+" : event.type === "deleted" ? "\u2212" : "\u2197"}</span><div><b>{messages[index]}</b><p>{event.before && event.after ? `${event.before} \u2192 ${event.after}` : event.type === "deleted" ? deletedDescription : event.projectTitle}</p></div><time dateTime={event.occurredAt}>{formatDateTime(event.occurredAt, locale)}</time></li>) : <li className={styles.emptyActivity}>{noneLabel}</li>}</ol></Panel>;
}

export async function ProjectNotFound() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = createTranslator({ locale, messages, namespace: "projects" });
  const common = createTranslator({ locale, messages, namespace: "common" });
  return <section className={styles.notFound}><span>404</span><h1>{t("notFoundTitle")}</h1><p>{t("notFoundDescription")}</p><div><Link className={styles.primaryLink} href="/projects">{common("backToProjects")}</Link><Link className={styles.secondaryLink} href="/dashboard">{t("goToDashboard")}</Link></div></section>;
}
