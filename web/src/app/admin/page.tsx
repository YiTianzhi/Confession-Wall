import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminPanel from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect("/login");

  const [posts, users, postCount, commentCount, userCount] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { author: { select: { email: true } } },
    }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.user.count(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">管理后台</h1>
      <AdminPanel
        posts={posts.map((p) => ({
          id: p.id,
          content: p.content,
          anonymousName: p.anonymousName,
          likeCount: p.likeCount,
          createdAt: p.createdAt.toISOString(),
          authorEmail: p.author.email,
        }))}
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          isAdmin: u.isAdmin,
          emailVerified: u.emailVerified,
          createdAt: u.createdAt.toISOString(),
        }))}
        counts={{ posts: postCount, comments: commentCount, users: userCount }}
      />
    </div>
  );
}
