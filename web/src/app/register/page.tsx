import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import RegisterForm from "@/components/RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-5 text-2xl font-bold">注册</h1>
      <RegisterForm />
    </div>
  );
}
