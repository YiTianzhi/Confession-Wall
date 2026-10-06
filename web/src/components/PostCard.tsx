"use client";

import { useState } from "react";
import Link from "next/link";
import { timeago } from "@/lib/format";

type Props = {
  post: {
    id: number;
    anonymousName: string;
    content: string;
    likeCount: number;
    commentCount: number;
    createdAt: string;
  };
};

function readLiked(): Set<number> {
  if (typeof document === "undefined") return new Set();
  const raw =
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("liked="))
      ?.slice(6) || "";
  return new Set(raw.split(",").filter(Boolean).map(Number));
}

export default function PostCard({ post }: Props) {
  const [liked, setLiked] = useState(() => readLiked().has(post.id));
  const [likeCount, setLikeCount] = useState(post.likeCount);

  async function toggleLike() {
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLikeCount(data.likeCount);
      setLiked((v) => !v);
    }
  }

  return (
    <article className="rounded-2xl border border-pink-100 bg-white p-5 shadow">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-violet-400 text-white">
          {post.anonymousName[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{post.anonymousName}</div>
          <div className="text-xs text-slate-400">{timeago(post.createdAt)}</div>
        </div>
      </header>

      <p className="my-4 whitespace-pre-wrap break-words leading-7">{post.content}</p>

      <footer className="flex items-center gap-2 border-t border-pink-100 pt-3">
        <button
          onClick={toggleLike}
          className={`rounded-full px-3 py-1 text-sm ${
            liked ? "text-red-500" : "text-slate-500 hover:text-pink-600"
          }`}
        >
          ♥ {likeCount}
        </button>
        <Link
          href={`/post/${post.id}`}
          className="rounded-full px-3 py-1 text-sm text-slate-500 hover:text-pink-600"
        >
          💬 {post.commentCount}
        </Link>
      </footer>
    </article>
  );
}
