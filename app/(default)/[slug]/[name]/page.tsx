import { redirect } from "next/navigation";

export const runtime = "edge";

export default async function ({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  redirect(`/coin/${name}`);
}
