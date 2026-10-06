import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { _count: { select: { comments: true } } },
  });

  return (
    <>
      <section className="mb-8 text-center">
        <img
          src="/bjjdfz.png"
          alt="北京交通大学附属中学校徽"
          className="mx-auto mb-2 h-28 w-28 object-contain drop-shadow"
        />
        <h1 className="mx-auto mb-2 max-w-full bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-3xl font-bold leading-snug text-transparent">
          北京交通大学附属中学表白墙
        </h1>
        <p className="mb-3 text-slate-500">把不敢说出口的话，写在这里吧 💌</p>
        <span className="mb-4 inline-block rounded-full border border-pink-100 bg-white/70 px-3 py-1 text-xs text-slate-500">
          🤖 内容由 AI 辅助审核
        </span>
        <div>
          <Link
            href="/post/new"
            className="rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-6 py-2.5 font-semibold text-white shadow hover:opacity-90"
          >
            发布表白
          </Link>
        </div>
      </section>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-slate-400">还没有表白，快来发布第一条吧！</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={{
                id: post.id,
                anonymousName: post.anonymousName,
                content: post.content,
                likeCount: post.likeCount,
                commentCount: post._count.comments,
                createdAt: post.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}
