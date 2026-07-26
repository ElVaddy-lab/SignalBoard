import { cn } from "@/lib/utils";

import styles from "./ui.module.css";

export function ProgressBar({
  ariaLabel,
  className,
  value,
}: {
  ariaLabel?: string;
  className?: string;
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div aria-label={ariaLabel ?? `${safeValue}% complete`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={safeValue} className={cn(styles.progress, className)} role="progressbar">
      <span style={{ width: `${safeValue}%` }} />
    </div>
  );
}
