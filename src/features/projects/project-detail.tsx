"use client";

import { ArrowLeft, CalendarDays, Clock3, Pencil, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { Project, ProjectActivity } from "@/data/projects";
import { activityMessageKey } from "@/features/activity/contracts";
import type { AppLocale } from "@/i18n/config";

import type { ProjectInput } from "./contracts";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { Priority, Status } from "./projects-list";
import { deadlineLabel, formatDate, formatDateTime } from "./project-presentation";
import { ProjectSheet } from "./project-sheet";
import { deleteProjectAction, updateProjectAction } from "./server";
import styles from "./projects.module.css";

export function ProjectDetail({ activity, project }: { activity: ProjectActivity[]; project: Project }) {
  const router = useRouter();
  const t = useTranslations("projects");
  const common = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deadlineLabels = { none: t("noDeadline"), overdue: t("overdue"), upcoming: t("upcoming"), completed: t("completed"), scheduled: t("scheduled") };
  const currentDeadlineLabel = deadlineLabel(project, deadlineLabels);
  const save = async (input: ProjectInput) => {
    await updateProjectAction(project.id, input);
    router.refresh();
  };
  const remove = async () => { await deleteProjectAction(project.id); router.push("/projects"); router.refresh(); };

  return <div className={styles.projectDetail}>
    <Link className={styles.backLink} href="/projects"><ArrowLeft aria-hidden="true" size={18} />{common("backToProjects")}</Link>
    <header className={styles.detailHeader}><div><h1>{project.title}</h1><div className={styles.detailBadges}><Status value={project.status} /><Priority value={project.priority} /></div></div><div><Button onClick={() => setEditing(true)} variant="secondary"><Pencil aria-hidden="true" size={17} />{t("edit")}</Button><Button onClick={() => setDeleting(true)} variant="ghost"><Trash2 aria-hidden="true" size={17} />{t("delete")}</Button></div></header>
    <div className={styles.detailGrid}><Panel className={styles.overviewPanel}><h2>{t("projectOverview")}</h2><p className={styles.description}>{project.description ?? t("noDescription")}</p><div className={styles.detailCompletion}><span>{t("completion")}</span><b>{project.completion}%</b><ProgressBar value={project.completion} /></div><dl className={styles.metadataGrid}><Metadata icon={<UserRound aria-hidden="true" size={24} />} label={t("projectLead")} value={project.projectLead} /><Metadata icon={<CalendarDays aria-hidden="true" size={24} />} label={t("deadline")} value={<><span>{formatDate(project.deadline, locale, deadlineLabels.none)}</span><small className={currentDeadlineLabel === deadlineLabels.overdue ? styles.overdueText : undefined}>{currentDeadlineLabel}</small></>} /><Metadata icon={<CalendarDays aria-hidden="true" size={24} />} label={t("created")} value={formatDate(project.createdAt.slice(0, 10), locale, deadlineLabels.none)} /><Metadata icon={<Clock3 aria-hidden="true" size={24} />} label={t("updated")} value={formatDateTime(project.updatedAt, locale)} /></dl></Panel><ActivityTimeline activity={activity} /></div>
    <ProjectSheet key={`${project.id}-${editing ? "open" : "closed"}`} onClose={() => setEditing(false)} onSave={save} open={editing} project={project} />
    <DeleteProjectDialog onClose={() => setDeleting(false)} onConfirm={remove} open={deleting} projectTitle={project.title} />
  </div>;
}

function Metadata({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) { return <div><dt>{icon}<span>{label}</span></dt><dd>{value}</dd></div>; }

function ActivityTimeline({ activity }: { activity: ProjectActivity[] }) {
  const t = useTranslations("activity");
  const projects = useTranslations("projects");
  const locale = useLocale() as AppLocale;
  return <Panel className={styles.activityPanel}><h2>{projects("activityTimeline")}</h2><ol className={styles.activityTimeline}>{activity.length ? activity.map((event) => <li key={event.id}><span className={`${styles.activityIcon} ${styles[event.type]}`}>{event.type === "created" ? "+" : event.type === "deleted" ? "\u2212" : "\u2197"}</span><div><b>{t(activityMessageKey(event))}</b><p>{event.before && event.after ? `${event.before} \u2192 ${event.after}` : event.type === "deleted" ? t("deletedDescription") : event.projectTitle}</p></div><time dateTime={event.occurredAt}>{formatDateTime(event.occurredAt, locale)}</time></li>) : <li className={styles.emptyActivity}>{t("none")}</li>}</ol></Panel>;
}

export function ProjectNotFound() {
  const t = useTranslations("projects");
  const common = useTranslations("common");
  return <section className={styles.notFound}><span>404</span><h1>{t("notFoundTitle")}</h1><p>{t("notFoundDescription")}</p><div><Link className={styles.primaryLink} href="/projects">{common("backToProjects")}</Link><Link className={styles.secondaryLink} href="/dashboard">{t("goToDashboard")}</Link></div></section>;
}
