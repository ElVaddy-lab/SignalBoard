"use client";

import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import styles from "./dashboard.module.css";

export function DashboardError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("dashboard");
  const projects = useTranslations("projects");

  return (
    <div className={styles.dashboard}>
      <section className={styles.dashboardError}>
        <AlertCircle aria-hidden="true" size={60} />
        <div>
          <h1>{t("loadErrorTitle")}</h1>
          <p>{t("loadErrorDescription")}</p>
          <div>
            <Button onClick={onRetry}>
              <RefreshCw aria-hidden="true" size={18} />
              {t("tryAgain")}
            </Button>
            <Link href="/projects">
              {projects("title")} <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
          <small>{t("loadErrorHint")}</small>
        </div>
      </section>
    </div>
  );
}
