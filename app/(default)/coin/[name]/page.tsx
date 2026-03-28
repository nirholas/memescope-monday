import { findProjectByName, getRandomProjects } from "@/models/project";

import Single from "@/templates/tailspark/landing/pages/single";
import { findCategoryByName } from "@/models/category";
import pagejson from "@/pagejson/en.json";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const project = await findProjectByName(name);

  return {
    title: `${project?.title || "-"}${project?.ticker ? ` ($${project.ticker})` : ""} | ${pagejson?.metadata?.title}`,
    description: `${project?.description || "Discover this memecoin on Memescope Monday"}`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_WEB_URL}/coin/${name}`,
    },
  };
}

export default async function ({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  const project = await findProjectByName(name);
  if (!project || !project.uuid) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-20 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Coin not found</h1>
        <p className="text-[#8b8d98]">
          This coin doesn&apos;t exist or has been removed.
        </p>
        <a
          href="/"
          className="inline-block mt-6 px-6 py-3 rounded-lg bg-[#00ff88] text-[#0a0b0f] font-semibold"
        >
          Back to Directory
        </a>
      </div>
    );
  }

  const category = await findCategoryByName(project.category || "");
  const more_projects = await getRandomProjects(1, 20);

  return (
    <Single
      project={project}
      more_projects={more_projects}
      category={category}
    />
  );
}
