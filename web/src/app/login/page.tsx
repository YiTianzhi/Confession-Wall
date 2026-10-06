import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-5 text-2xl font-bold">登录</h1>
      <LoginForm />
    </div>
  );
}
