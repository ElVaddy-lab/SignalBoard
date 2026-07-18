import { DashboardExperience } from "@/features/dashboard/dashboard-experience";
import { getDashboardData } from "@/features/dashboard/server";

export default async function DashboardPage() {
  return <DashboardExperience data={await getDashboardData()} />;
}
