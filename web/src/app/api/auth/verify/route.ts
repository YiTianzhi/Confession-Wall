import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, code } = await request.json();
  const normalized = String(email || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });

  if (!user || !user.verificationCode) {
    return NextResponse.json({ error: "请先获取验证码。" }, { status: 400 });
  }
  if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "验证码已过期，请重新获取。" }, { status: 400 });
  }
  if (user.verificationCode !== String(code || "").trim()) {
    return NextResponse.json({ error: "验证码错误。" }, { status: 400 });
  }

  const isAdmin = (process.env.ADMIN_EMAIL || "").toLowerCase() === normalized;
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, isAdmin, verificationCode: null, verificationCodeExpiresAt: null },
  });

  const token = await createSessionToken({ id: user.id, email: user.email, isAdmin });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
