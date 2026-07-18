import { ProjectsExperience } from "@/features/projects/projects-experience";
import { getProjectsPage } from "@/features/projects/server";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await getProjectsPage(await searchParams);
  return <ProjectsExperience initialParams={data.params} initialProjects={data.projects} totalCount={data.totalCount} />;
}
