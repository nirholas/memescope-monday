import {
  ProjectStatus,
  findProjectByName,
  insertProject,
  updateProject,
} from "@/models/project";

import { Project } from "@/types/project";
import { genUuid } from "@/utils";
import { getIsoTimestr } from "@/utils/time";

export function parseProject(project: Project): Project | undefined {
  try {
    if (!project || !project.title) {
      return;
    }

    if (!project.name) {
      // Generate slug from title + ticker
      const base = `${project.title}${project.ticker ? "-" + project.ticker : ""}`;
      project.name = base
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    return project;
  } catch (e) {
    console.log("parse project failed", e);
    return;
  }
}

export async function saveProject(
  project: Project
): Promise<Project | undefined> {
  try {
    if (!project.name) {
      throw new Error("invalid project");
    }

    const existProject = await findProjectByName(project.name);

    if (existProject && existProject.uuid) {
      project.uuid = existProject.uuid;
      project.created_at = existProject.created_at;
      await updateProject(existProject.uuid, project);
      return { ...existProject, ...project };
    }

    const created_at = getIsoTimestr();

    project.uuid = genUuid();
    project.created_at = created_at;
    project.updated_at = created_at;
    project.status = ProjectStatus.Created;
    project.target = "_self";
    project.is_featured = true;
    project.sort = 1;
    project.votes = 0;

    if (project.paid_expedited) {
      project.status = ProjectStatus.Created; // auto-approve
    }

    await insertProject(project);

    return project;
  } catch (e) {
    console.error("save project failed: ", e);
    throw e;
  }
}
