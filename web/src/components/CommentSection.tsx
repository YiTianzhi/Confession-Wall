"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { timeago } from "@/lib/format";

type Comment = { id: number; anonymousName: string; content: string; createdAt: string };

export default function CommentSection({
  postId,
  initialComments,
  isLoggedIn,
}: {
  postId: number;
  initialComments: Comment[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [comments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const fd = new FormData();
    fd.set("content", content);
    fd.set("nickname", nickname);

    const res = await fetch(`/api/posts/${postId}/comments`, { method: "POST", body: fd });
    if (res.ok) {
      setContent("");
      setNickname("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "评论失败，请重试。");
    }
    setBusy(false);
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-bold">评论（{comments.length}）</h2>

      {isLoggedIn ? (
      <form onSubmit={submit} className="mb-4 rounded-2xl border border-pink-100 bg-white p-4 shadow">
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={20}
          placeholder="匿名昵称（可选）"
          className="mb-2 w-full rounded-lg border border-pink-100 px-3 py-2 text-sm outline-none focus:border-pink-400"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={300}
          rows={3}
          required
          placeholder="写下你的鼓励或回应…"
          className="w-full rounded-lg border border-pink-100 px-3 py-2 text-sm outline-none focus:border-pink-400"
        />
        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-3 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          发表评论
        </button>
      </form>
      ) : (
        <p className="mb-4 rounded-2xl border border-pink-100 bg-white p-4 text-sm text-slate-500">
          请先 <a href="/login" className="text-pink-600 hover:underline">登录</a> 后再评论。
        </p>
      )}

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-slate-400">还没有评论，来抢沙发～</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-2xl border border-pink-100 bg-white p-4 shadow">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-violet-400 text-sm text-white">
                  {c.anonymousName[0]}
                </span>
                <span className="font-semibold">{c.anonymousName}</span>
                <span className="text-xs text-slate-400">{timeago(c.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words leading-6">{c.content}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
