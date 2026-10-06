import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { generateCode, sendVerificationEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  const normalized = String(email || "").trim().toLowerCase();

  if (!EMAIL_RE.test(normalized)) {
    return NextResponse.json({ error: "邮箱格式不正确。" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "密码至少 6 位。" }, { status: 400 });
  }

  const code = generateCode();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  const existing = await prisma.user.findUnique({ where: { email: normalized } });
  if (existing?.emailVerified) {
    return NextResponse.json({ error: "该邮箱已注册，请直接登录。" }, { status: 400 });
  }
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash: await hashPassword(password), verificationCode: code, verificationCodeExpiresAt: expires },
    });
  } else {
    await prisma.user.create({
      data: { email: normalized, passwordHash: await hashPassword(password), verificationCode: code, verificationCodeExpiresAt: expires },
    });
  }

  await sendVerificationEmail(normalized, code);
  const devCode = process.env.SMTP_HOST ? undefined : code;
  return NextResponse.json({ ok: true, devCode });
}
