import type { Project } from "@/data/projects";

import { statusTone } from "./project-presentation";
import styles from "./projects.module.css";

export function Status({
  label,
  value,
}: {
  label?: string;
  value: Project["status"];
}) {
  return (
    <span className={`${styles.dotLabel} ${styles[statusTone[value]]}`}>
      <i aria-hidden="true" />
      {label ?? value}
    </span>
  );
}

export function Priority({
  label,
  value,
}: {
  label?: string;
  value: Project["priority"];
}) {
  return (
    <span className={`${styles.dotLabel} ${styles[value.toLowerCase()]}`}>
      <i aria-hidden="true" />
      {label ?? value}
    </span>
  );
}
