import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCode, sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  const normalized = String(email || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || user.emailVerified) {
    return NextResponse.json({ error: "该邮箱无需验证或未注册。" }, { status: 400 });
  }

  const code = generateCode();
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationCode: code, verificationCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });
  await sendVerificationEmail(normalized, code);
  const devCode = process.env.SMTP_HOST ? undefined : code;
  return NextResponse.json({ ok: true, devCode });
}
