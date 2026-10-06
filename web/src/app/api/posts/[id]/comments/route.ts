import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateContent } from "@/lib/moderation";
import { randomNickname } from "@/lib/nickname";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await prisma.comment.findMany({
    where: { postId: Number(id) },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(comments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再评论。" }, { status: 401 });
  }

  const { id } = await params;
  const form = await request.formData();
  const content = String(form.get("content") || "").trim();
  const nickname = String(form.get("nickname") || "").trim();

  if (!content) {
    return NextResponse.json({ error: "评论不能为空。" }, { status: 400 });
  }
  if (content.length > 300) {
    return NextResponse.json({ error: "评论最多 300 字。" }, { status: 400 });
  }

  const { blocked, reason } = await evaluateContent(content);
  if (blocked) {
    return NextResponse.json(
      { error: "评论包含不合适的内容" + (reason ? `：${reason}` : "") + "，请修改后重试。" },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: { content, anonymousName: nickname || randomNickname(), postId: Number(id) },
  });
  return NextResponse.json({ id: comment.id }, { status: 201 });
}
