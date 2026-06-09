import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect("/dashboard")

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <LoginForm />
    </main>
  )
}
