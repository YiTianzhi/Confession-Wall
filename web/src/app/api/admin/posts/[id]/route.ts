import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.post.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
