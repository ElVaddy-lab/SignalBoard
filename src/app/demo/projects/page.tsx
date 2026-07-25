import type { Metadata } from "next";

import { getDemoCopy } from "@/features/demo/demo-copy";
import { listDemoProjects } from "@/features/demo/demo-data";
import { DemoProjectsDirectory } from "@/features/demo/demo-projects";
import { getLocale } from "@/features/preferences/locale";
import { parseProjectListParams } from "@/features/projects/project-list-contract";
import { getMessages } from "@/i18n/messages";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const copy = getDemoCopy(locale);
  return {
    title: `${copy.directoryTitle} · SignalBoard`,
    description: copy.directoryIntro,
  };
}

export default async function DemoProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawParams = await searchParams;
  const params = parseProjectListParams(rawParams);
  const locale = await getLocale();
  return (
    <DemoProjectsDirectory
      data={listDemoProjects(params)}
      locale={locale}
      messages={getMessages(locale)}
      params={params}
      searchParams={rawParams}
    />
  );
}
