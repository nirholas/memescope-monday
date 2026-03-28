import Categories from "@/templates/tailspark/landing/components/categories";
import { getCategories } from "@/models/category";
import { getFeaturedProjects } from "@/models/project";
import pageJson from "@/pagejson/en.json";

export const runtime = "edge";

export async function generateMetadata() {
  return {
    title: `Coin Categories | ${pageJson?.metadata?.title}`,
    description: `Browse memecoin categories on Memescope Monday`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_WEB_URL}/categories`,
    },
  };
}

export default async function () {
  const categories = await getCategories(1, 100);
  const projects = await getFeaturedProjects(1, 60);

  return <Categories categories={categories} projects={projects} />;
}
