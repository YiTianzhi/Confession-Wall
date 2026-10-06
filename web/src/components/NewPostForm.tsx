"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Turnstile from "./Turnstile";

export default function NewPostForm({ siteKey }: { siteKey: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [nickname, setNickname] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onToken = useCallback((t: string) => setToken(t), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const fd = new FormData();
    fd.set("content", content);
    fd.set("nickname", nickname);
    if (token) fd.set("cf-turnstile-response", token);

    const res = await fetch("/api/posts", { method: "POST", body: fd });
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "发布失败，请重试。");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-pink-100 bg-white p-5 shadow">
      <label className="mb-1 block text-sm font-semibold">匿名昵称（可选）</label>
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={20}
        placeholder="留空则自动生成，如「匿名小鹿」"
        className="mb-4 w-full rounded-lg border border-pink-100 px-3 py-2 outline-none focus:border-pink-400"
      />

      <label className="mb-1 block text-sm font-semibold">想说的话（500 字以内）</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        rows={6}
        required
        placeholder="把想说的话写在这里…"
        className="w-full rounded-lg border border-pink-100 px-3 py-2 outline-none focus:border-pink-400"
      />
      <div className="mt-1 text-right text-xs text-slate-400">{content.length} / 500</div>

      <p className="mt-2 text-xs text-slate-500">提交后内容将由 AI 辅助审核。</p>

      {siteKey ? (
        <div className="my-4">
          <Turnstile siteKey={siteKey} onToken={onToken} />
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-3 w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        发布
      </button>
    </form>
  );
}
