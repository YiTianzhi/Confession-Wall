"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("两次输入的密码不一致。");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      if (data.devCode) setDevCode(data.devCode);
      setStep("code");
    } else {
      setError(data.error || "注册失败，请重试。");
    }
    setBusy(false);
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "验证失败，请重试。");
      setBusy(false);
    }
  }

  async function resend() {
    const res = await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.devCode) setDevCode(data.devCode);
  }

  if (step === "code") {
    return (
      <form onSubmit={submitCode} className="rounded-2xl border border-pink-100 bg-white p-5 shadow">
        <h2 className="mb-1 text-lg font-bold">输入邮箱验证码</h2>
        <p className="mb-4 text-sm text-slate-500">验证码已发送到 {email}</p>
        {devCode ? (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            开发模式验证码：<b>{devCode}</b>
          </p>
        ) : null}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          maxLength={6}
          placeholder="6 位验证码"
          className="mb-3 w-full rounded-lg border border-pink-100 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-pink-400"
        />
        {error ? <p className="mb-2 text-sm text-red-500">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          验证并完成注册
        </button>
        <button type="button" onClick={resend} className="mt-3 w-full text-sm text-pink-600 hover:underline">
          重新发送验证码
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submitForm} className="rounded-2xl border border-pink-100 bg-white p-5 shadow">
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
        minLength={6}
        placeholder="至少 6 位"
        className="mb-4 w-full rounded-lg border border-pink-100 px-3 py-2 outline-none focus:border-pink-400"
      />
      <label className="mb-1 block text-sm font-semibold">确认密码</label>
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        placeholder="再输入一次"
        className="mb-4 w-full rounded-lg border border-pink-100 px-3 py-2 outline-none focus:border-pink-400"
      />
      {error ? <p className="mb-2 text-sm text-red-500">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-gradient-to-r from-pink-500 to-violet-500 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        发送验证码
      </button>
      <p className="mt-3 text-center text-sm text-slate-500">
        已有账号？<Link href="/login" className="text-pink-600 hover:underline">直接登录</Link>
      </p>
    </form>
  );
}
