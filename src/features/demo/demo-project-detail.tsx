import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createTranslator } from "next-intl";

import { ProgressBar } from "@/components/ui/progress-bar";
import type { Project, ProjectActivity } from "@/data/projects";
import { activityMessageKey } from "@/features/activity/contracts";
import { formatDate, formatDateTime } from "@/features/projects/project-presentation";
import type { AppLocale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

import { getDemoCopy } from "./demo-copy";
import styles from "./demo.module.css";

export function DemoProjectDetail({
  activity,
  locale,
  messages,
  project,
}: {
  activity: ProjectActivity[];
  locale: AppLocale;
  messages: Messages;
  project: Project;
}) {
  const copy = getDemoCopy(locale);
  const t = createTranslator({ locale, messages, namespace: "projects" });
  const activityT = createTranslator({ locale, messages, namespace: "activity" });

  return (
    <article className={styles.detail}>
      <Link className={styles.detailBack} href="/demo/projects">
        <ArrowLeft aria-hidden="true" size={17} /> {copy.backToProjects}
      </Link>
      <header className={styles.detailHeader}>
        <div>
          <span className={styles.eyebrow}>{copy.detailEyebrow}</span>
          <h1>{project.title}</h1>
          <p>{project.description}</p>
        </div>
        <strong>{t(`statusValues.${project.status}`)}</strong>
      </header>
      <ProgressBar
        ariaLabel={t("completionPercent", { value: project.completion })}
        value={project.completion}
      />
      <dl className={styles.detailStats}>
        <div><dt>{t("projectLead")}</dt><dd>{project.projectLead}</dd></div>
        <div><dt>{t("priority")}</dt><dd>{t(`priorityValues.${project.priority}`)}</dd></div>
        <div><dt>{t("deadline")}</dt><dd>{formatDate(project.deadline, locale, t("noDeadline"))}</dd></div>
        <div><dt>{t("completion")}</dt><dd>{project.completion}%</dd></div>
      </dl>
      <section className={styles.activityPanel}>
        <h2>{copy.activity}</h2>
        {activity.length ? (
          <ol>
            {activity.map((item) => (
              <li key={item.id}>
                <span aria-hidden="true">{item.type === "created" ? "+" : "↗"}</span>
                <div>
                  <strong>{activityT(activityMessageKey(item))}</strong>
                </div>
                <time>{formatDateTime(item.occurredAt, locale)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <p>{copy.deletedActivityNote}</p>
        )}
      </section>
    </article>
  );
}
