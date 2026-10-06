import nodemailer from "nodemailer";

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    // 开发环境：没有配置 SMTP 时打印到控制台，方便本地测试
    console.log(`[DEV] 验证码（${email}）：${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to: email,
    subject: "校园表白墙 · 邮箱验证码",
    text: `你的验证码是：${code}，10 分钟内有效。如果这不是你本人操作，请忽略本邮件。`,
  });
}
