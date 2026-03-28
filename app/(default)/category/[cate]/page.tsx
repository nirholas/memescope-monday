import {
  getProjectsByCategory,
  getProjectsCountByCategory,
} from "@/models/project";

import Category from "@/templates/tailspark/landing/components/category";
import { findCategoryByName } from "@/models/category";
import pageJson from "@/pagejson/en.json";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cate: string }>;
}) {
  const { cate } = await params;
  const category = await findCategoryByName(cate);

  return {
    title: `${category?.title || cate} Coins | ${pageJson?.metadata?.title}`,
    description: `Browse ${category?.title || cate} memecoins on Memescope Monday`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_WEB_URL}/category/${cate}`,
    },
  };
}

export default async function ({
  params,
}: {
  params: Promise<{ cate: string }>;
}) {
  const { cate } = await params;
  if (!cate) return <div className="text-white p-8">Invalid params</div>;

  const category = await findCategoryByName(cate);
  if (!category) return <div className="text-white p-8">Category not found</div>;

  const projects = await getProjectsByCategory(cate, 1, 300);
  category.projects_count = await getProjectsCountByCategory(cate);

  return <Category category={category} projects={projects} />;
}
