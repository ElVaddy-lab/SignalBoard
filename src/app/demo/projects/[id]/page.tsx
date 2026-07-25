import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDemoCopy } from "@/features/demo/demo-copy";
import { getDemoProject } from "@/features/demo/demo-data";
import { DemoProjectDetail } from "@/features/demo/demo-project-detail";
import { getLocale } from "@/features/preferences/locale";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = getDemoProject(id);
  const copy = getDemoCopy(await getLocale());
  return data
    ? {
        title: `${data.project.title} · ${copy.badge}`,
        description: `${copy.detailEyebrow}: ${data.project.title}. ${copy.directoryIntro}`,
      }
    : {
        title: `${copy.projectNotFoundTitle} · SignalBoard`,
        description: copy.projectNotFoundBody,
      };
}

export default async function DemoProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getDemoProject(id);
  if (!data) notFound();
  const locale = await getLocale();
  return (
    <DemoProjectDetail
      activity={data.activity}
      locale={locale}
      messages={getMessages(locale)}
      project={data.project}
    />
  );
}
