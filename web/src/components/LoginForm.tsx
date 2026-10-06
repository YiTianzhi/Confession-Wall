"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "登录失败，请重试。");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-pink-100 bg-white p-5 shadow">
      <label className="mb-1 block text-sm font-semibold">邮箱</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="you@example.com"
        className="mb-4 w-full rounded-lg border border-pink-100 px-3 py-2 outline-none focus:border-pink-400"
      />
      <label className="mb-1 block text-sm font-semibold">密码</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        placeholder="至少 6 位"
        className="mb-4 w-full rounded-lg border border-pink-100 px-3 py-2 outline-none focus:border-pink-400"
      />
      {error ? <p className="mb-2 text-sm text-red-500">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        登录
      </button>
      <p className="mt-3 text-center text-sm text-slate-500">
        还没有账号？<Link href="/register" className="text-pink-600 hover:underline">立即注册</Link>
      </p>
    </form>
  );
}
