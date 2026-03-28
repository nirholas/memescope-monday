import { respData, respErr } from "@/utils/resp";
import { upvoteProject } from "@/models/project";

export const runtime = "edge";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    if (!name) return respErr("name is required");

    const votes = await upvoteProject(name);
    return respData({ votes });
  } catch (e) {
    console.log("vote failed:", e);
    return respErr("vote failed");
  }
}
