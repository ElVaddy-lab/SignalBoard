"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export default function ProjectsRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("projects");
  const dashboard = useTranslations("dashboard");
  return <section style={{ alignItems: "center", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}><AlertCircle aria-hidden="true" color="var(--danger, #c83f2b)" size={54} /><h1>{t("loadErrorTitle")}</h1><p>{t("loadErrorDescription")}</p><Button onClick={reset}>{dashboard("tryAgain")}</Button></section>;
}
