import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const postId = Number(id);
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "内容不存在" }, { status: 404 });

  const likedRaw = request.cookies.get("liked")?.value || "";
  const liked = new Set(likedRaw.split(",").filter((x) => x !== ""));
  let likeCount = post.likeCount;

  if (liked.has(id)) {
    liked.delete(id);
    likeCount = Math.max(0, likeCount - 1);
  } else {
    liked.add(id);
    likeCount += 1;
  }

  await prisma.post.update({ where: { id: postId }, data: { likeCount } });

  const res = NextResponse.json({ likeCount });
  res.cookies.set(
    "liked",
    [...liked].map(Number).sort((a, b) => a - b).join(","),
    { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 }
  );
  return res;
}
