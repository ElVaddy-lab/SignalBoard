import { ProjectsExperience } from "@/features/projects/projects-experience";
import { ProjectsDirectory } from "@/features/projects/projects-directory";
import { getProjectsPage } from "@/features/projects/server";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await getProjectsPage(await searchParams);
  return (
    <ProjectsExperience>
      <ProjectsDirectory
        params={data.params}
        projects={data.projects}
        totalCount={data.totalCount}
      />
    </ProjectsExperience>
  );
}
