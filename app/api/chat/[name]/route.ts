import { respData, respErr } from "@/utils/resp";
import { getChatMessages, insertChatMessage } from "@/models/project";
import { genUuid } from "@/utils";

export const runtime = "edge";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    if (!name) return respErr("name is required");

    const messages = await getChatMessages(name, 200);
    return respData(messages);
  } catch (e) {
    console.log("get chat failed:", e);
    return respErr("get chat failed");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    if (!name) return respErr("name is required");

    const { author, text } = await req.json();
    if (!text || !text.trim()) return respErr("text is required");

    const message = await insertChatMessage({
      uuid: genUuid(),
      coin_slug: name,
      author: author || "Anon",
      text: text.slice(0, 280),
      created_at: new Date().toISOString(),
    });

    return respData(message);
  } catch (e) {
    console.log("post chat failed:", e);
    return respErr("post chat failed");
  }
}
