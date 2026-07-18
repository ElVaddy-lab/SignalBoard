"use client";

import { useTranslations } from "next-intl";

export default function ProjectDetailLoading() {
  const t = useTranslations("projects");
  return <div aria-busy="true" aria-label={t("loading")} style={{ minHeight: "60vh", padding: "32px" }}><div style={{ background: "var(--sb-surface-subtle, #f1ece2)", borderRadius: "8px", height: "48px", maxWidth: "360px" }} /><div style={{ background: "var(--sb-surface-subtle, #f1ece2)", borderRadius: "8px", height: "420px", marginTop: "24px" }} /></div>;
}
