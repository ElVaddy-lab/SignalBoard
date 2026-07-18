import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

import styles from "./ui.module.css";

export function Panel({ children, className, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <section className={cn(styles.panel, className)} {...props}>{children}</section>;
}
