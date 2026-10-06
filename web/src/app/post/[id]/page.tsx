import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostCard from "@/components/PostCard";
import CommentSection from "@/components/CommentSection";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });
  if (!post) notFound();

  return (
    <div>
      <Link href="/" className="mb-3 inline-block text-sm text-pink-600 hover:underline">
        ← 返回表白墙
      </Link>
      <PostCard
        post={{
          id: post.id,
          anonymousName: post.anonymousName,
          content: post.content,
          likeCount: post.likeCount,
          commentCount: post.comments.length,
          createdAt: post.createdAt.toISOString(),
        }}
      />
      <CommentSection
        postId={post.id}
        isLoggedIn={Boolean(user)}
        initialComments={post.comments.map((c) => ({
          id: c.id,
          anonymousName: c.anonymousName,
          content: c.content,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
