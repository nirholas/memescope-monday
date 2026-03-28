import { respData, respErr } from "@/utils/resp";
import { getProjectsWithoutSummary } from "@/models/project";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { page, limit } = await req.json();

    const projects = await getProjectsWithoutSummary(page, limit);

    return respData(projects);
  } catch (e) {
    console.log("summarize projects failed: ", e);
    return respErr("summarize projects failed");
  }
}
