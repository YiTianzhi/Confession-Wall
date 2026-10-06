import NewPostForm from "@/components/NewPostForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-bold">发布表白</h1>
      <p className="mb-5 text-sm text-slate-500">
        发布后将以匿名昵称展示，不会显示你的任何个人信息。
      </p>
      <NewPostForm siteKey={process.env.TURNSTILE_SITE_KEY || ""} />
    </div>
  );
}
