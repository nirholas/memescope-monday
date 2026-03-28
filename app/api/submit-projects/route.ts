import { parseProject, saveProject } from "@/services/project";
import { respData, respErr } from "@/utils/resp";

import { Project } from "@/types/project";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const projects: Project[] = await req.json();

    const parsedProjects = projects.map((p) => parseProject(p));
    if (!parsedProjects) {
      return respErr("invalid project");
    }

    const savedProjects = await Promise.all(
      parsedProjects
        .filter((p): p is Project => p !== undefined)
        .map(saveProject)
    );
    if (!savedProjects) {
      return respErr("save project failed");
    }

    return respData(savedProjects);
  } catch (e) {
    console.log("submit projects failed", e);
    return respErr("submit projects failed");
  }
}
