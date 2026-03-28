import { Category } from "@/types/category";
import Crumb from "./crumb";
import Link from "next/link";
import { Project } from "@/types/project";
import Projects from "../projects";

export default function ({
  categories,
  projects,
}: {
  categories: Category[];
  projects: Project[];
}) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-4 md:px-10 md:py-4 lg:py-4">
      <Crumb />
      <div className="mt-12 text-center">
        <h1 className="text-4xl text-[#00ff88] font-bold mb-2">
          Coin Categories
        </h1>
        <p className="text-[#8b8d98] mt-2">
          Browse memecoins by category
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {categories &&
          categories.map((category: Category) => (
            <Link
              key={category.name}
              href={`/category/${category.name}`}
              className="rounded-xl p-4 border border-[#2a2d3a] bg-[#181a25] hover:border-[#00ff88]/30 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">{category.title}</span>
                <span className="text-[#00ff88] text-sm font-bold">
                  {category.projects_count}
                </span>
              </div>
            </Link>
          ))}
      </div>

      <div className="w-full text-center">
        <h2 className="text-white font-bold text-2xl mt-16 mb-4">
          Featured Coins
        </h2>
        {projects && <Projects projects={projects} />}
      </div>
    </div>
  );
}
