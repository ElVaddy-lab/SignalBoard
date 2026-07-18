import { ProjectDetail } from "@/features/projects/project-detail";
import { getProjectDetail } from "@/features/projects/server";
import { notFound } from "next/navigation";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProjectDetail(id);
  if (!data.project) notFound();
  return <ProjectDetail activity={data.activity} project={data.project} />;
}
