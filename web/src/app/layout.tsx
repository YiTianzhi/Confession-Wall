import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "北京交通大学附属中学表白墙",
  description: "把不敢说出口的话，写在这里吧",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-sky-50 text-slate-800">
        <header className="sticky top-0 z-10 border-b border-pink-100 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
            <a href="/" className="flex min-w-0 items-center gap-2">
              <img src="/bjjdfz.png" alt="校徽" className="h-9 w-9 shrink-0 object-contain" />
              <span className="truncate text-base font-bold text-pink-700">北京交通大学附属中学表白墙</span>
            </a>
            <nav className="flex shrink-0 items-center gap-3 text-sm">
              <a href="/" className="text-slate-700 hover:text-pink-600">首页</a>
              {user ? (
                <>
                  <span className="hidden max-w-[140px] truncate text-slate-500 sm:inline">{user.email}</span>
                  {user.isAdmin ? <a href="/admin" className="text-slate-700 hover:text-pink-600">管理</a> : null}
                  <LogoutButton />
                </>
              ) : (
                <>
                  <a href="/login" className="text-slate-700 hover:text-pink-600">登录</a>
                  <a href="/register" className="text-slate-700 hover:text-pink-600">注册</a>
                </>
              )}
              <a href="/post/new" className="rounded-full bg-pink-500 px-4 py-1.5 text-white hover:bg-pink-600">发布表白</a>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl px-4 py-8">{children}</main>

        <footer className="py-6 text-center text-sm text-slate-500">
          北京交通大学附属中学表白墙 · 请文明发言，珍惜每一次心动 💕
        </footer>
      </body>
    </html>
  );
}
