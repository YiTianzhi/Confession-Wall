import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateContent } from "@/lib/moderation";
import { randomNickname } from "@/lib/nickname";
import { verifyTurnstile } from "@/lib/turnstile";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const page = Number(request.nextUrl.searchParams.get("page") || "1");
  const perPage = 10;
  const total = await prisma.post.count();
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
    include: { _count: { select: { comments: true } } },
  });

  return NextResponse.json({
    posts,
    page,
    pages: Math.max(1, Math.ceil(total / perPage)),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再发布。" }, { status: 401 });
  }

  const form = await request.formData();
  const content = String(form.get("content") || "").trim();
  const nickname = String(form.get("nickname") || "").trim();
  const turnstileToken = String(form.get("cf-turnstile-response") || "");

  if (process.env.TURNSTILE_SECRET_KEY) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "";
    if (!turnstileToken || !(await verifyTurnstile(turnstileToken, ip))) {
      return NextResponse.json({ error: "人机验证未通过，请重试。" }, { status: 400 });
    }
  }

  if (!content) {
    return NextResponse.json({ error: "内容不能为空。" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "内容最多 500 字。" }, { status: 400 });
  }
  if (nickname.length > 20) {
    return NextResponse.json({ error: "昵称最多 20 个字符。" }, { status: 400 });
  }

  const { blocked, reason } = await evaluateContent(content);
  if (blocked) {
    return NextResponse.json(
      { error: "内容包含不合适的内容" + (reason ? `：${reason}` : "") + "，请修改后重试。" },
      { status: 400 }
    );
  }

  const post = await prisma.post.create({
    data: { content, anonymousName: nickname || randomNickname(), authorId: user.id },
  });
  return NextResponse.json({ id: post.id }, { status: 201 });
}
