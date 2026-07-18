"use client";

import { useTranslations } from "next-intl";

export default function ProjectsLoading() {
  const t = useTranslations("projects");
  return <div aria-busy="true" aria-label={t("loading")} style={{ minHeight: "60vh", padding: "32px" }}><div style={{ background: "var(--sb-surface-subtle, #f1ece2)", borderRadius: "8px", height: "56px", maxWidth: "320px" }} /><div style={{ background: "var(--sb-surface-subtle, #f1ece2)", borderRadius: "8px", height: "420px", marginTop: "22px" }} /></div>;
}
