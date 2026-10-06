import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!target) return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  if (target.id === admin.id) {
    return NextResponse.json({ error: "不能修改自己的管理员状态" }, { status: 400 });
  }
  const { isAdmin } = await request.json();
  await prisma.user.update({ where: { id: target.id }, data: { isAdmin: Boolean(isAdmin) } });
  return NextResponse.json({ ok: true });
}
