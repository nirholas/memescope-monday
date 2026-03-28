import { respData, respErr } from "@/utils/resp";
import { findProjectByName } from "@/models/project";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) {
      return respErr("name is required");
    }

    const project = await findProjectByName(name);
    if (!project || !project.uuid) {
      return respErr("invalid project");
    }

    return respData(project);
  } catch (e) {
    console.log("summarize project failed: ", e);
    return respErr("summarize project failed");
  }
}
