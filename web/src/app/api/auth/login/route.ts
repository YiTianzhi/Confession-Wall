import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const normalized = String(email || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  if (!user || !(await verifyPassword(String(password || ""), user.passwordHash))) {
    return NextResponse.json({ error: "邮箱或密码错误。" }, { status: 400 });
  }
  if (!user.emailVerified) {
    return NextResponse.json({ error: "邮箱尚未验证，请先完成验证。" }, { status: 400 });
  }

  const token = await createSessionToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
