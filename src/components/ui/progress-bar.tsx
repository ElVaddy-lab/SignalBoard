import { cn } from "@/lib/utils";

import styles from "./ui.module.css";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div aria-label={`${safeValue}% complete`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={safeValue} className={cn(styles.progress, className)} role="progressbar">
      <span style={{ width: `${safeValue}%` }} />
    </div>
  );
}
