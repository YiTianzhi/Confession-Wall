"use client";

import { useRouter } from "next/navigation";

type AdminPost = {
  id: number;
  content: string;
  anonymousName: string;
  likeCount: number;
  createdAt: string;
  authorEmail: string;
};

type AdminUser = {
  id: number;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
};

export default function AdminPanel({
  posts,
  users,
  counts,
}: {
  posts: AdminPost[];
  users: AdminUser[];
  counts: { posts: number; comments: number; users: number };
}) {
  const router = useRouter();

  async function deletePost(id: number) {
    if (!confirm("确定删除这条表白吗？")) return;
    const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  async function toggleAdmin(id: number, isAdmin: boolean) {
    if (!confirm(isAdmin ? "确定取消该用户的管理员权限吗？" : "确定把该用户设为管理员吗？")) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !isAdmin }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-pink-100 bg-white p-4 text-center shadow">
          <div className="text-2xl font-bold text-pink-600">{counts.posts}</div>
          <div className="text-sm text-slate-500">表白</div>
        </div>
        <div className="rounded-2xl border border-pink-100 bg-white p-4 text-center shadow">
          <div className="text-2xl font-bold text-violet-600">{counts.comments}</div>
          <div className="text-sm text-slate-500">评论</div>
        </div>
        <div className="rounded-2xl border border-pink-100 bg-white p-4 text-center shadow">
          <div className="text-2xl font-bold text-sky-600">{counts.users}</div>
          <div className="text-sm text-slate-500">用户</div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">表白管理（{posts.length}）</h2>
        <div className="space-y-3">
          {posts.length === 0 ? (
            <p className="py-8 text-center text-slate-400">暂无表白</p>
          ) : (
            posts.map((p) => (
              <div key={p.id} className="rounded-2xl border border-pink-100 bg-white p-4 shadow">
                <p className="whitespace-pre-wrap break-words leading-6">{p.content}</p>
                <div className="mt-2 text-xs text-slate-400">
                  {p.anonymousName} · 作者 {p.authorEmail} · ♥ {p.likeCount} · {new Date(p.createdAt).toLocaleString("zh-CN")}
                </div>
                <button
                  onClick={() => deletePost(p.id)}
                  className="mt-3 rounded-full bg-red-500 px-4 py-1.5 text-sm text-white hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">用户管理（{users.length}）</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 rounded-xl border border-pink-100 bg-white px-4 py-3 shadow">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{u.email}</div>
                <div className="text-xs text-slate-400">
                  {u.emailVerified ? "已验证" : "未验证"} · {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                </div>
              </div>
              {u.isAdmin ? (
                <button onClick={() => toggleAdmin(u.id, true)} className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 hover:bg-amber-200">
                  管理员
                </button>
              ) : (
                <button onClick={() => toggleAdmin(u.id, false)} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200">
                  设为管理员
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
