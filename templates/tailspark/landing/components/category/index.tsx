import { Category } from "@/types/category";
import Crumb from "./crumb";
import { Project } from "@/types/project";
import Projects from "../projects";

export default function ({
  category,
  projects,
}: {
  category: Category;
  projects: Project[];
}) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-4 md:px-10 md:py-4 lg:py-4">
      <Crumb category={category} />
      <div className="mt-12 text-center">
        <h1 className="text-4xl text-[#00ff88] font-bold mb-2">
          {category.title} Coins
        </h1>
        <p className="text-[#8b8d98] mt-2">
          <span className="text-[#00ff88] font-bold">
            {category.projects_count || 0}
          </span>{" "}
          coins found
        </p>
      </div>

      <div className="w-full mt-8">
        {projects && <Projects projects={projects} />}
      </div>
    </div>
  );
}
