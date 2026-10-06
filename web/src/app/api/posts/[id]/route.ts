import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });
  if (!post) return NextResponse.json({ error: "内容不存在" }, { status: 404 });
  return NextResponse.json(post);
}
