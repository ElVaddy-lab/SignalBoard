import Link from "next/link";

import { getDemoCopy } from "@/features/demo/demo-copy";
import { getLocale } from "@/features/preferences/locale";

export default async function DemoProjectNotFound() {
  const copy = getDemoCopy(await getLocale());
  return (
    <section style={{ padding: "80px 20px", textAlign: "center" }}>
      <h1>{copy.projectNotFoundTitle}</h1>
      <p>{copy.projectNotFoundBody}</p>
      <Link href="/demo/projects">{copy.backToProjects}</Link>
    </section>
  );
}
