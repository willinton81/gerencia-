import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { RegisterForm } from "@/components/register-form"

export default async function RegisterPage() {
  const session = await getSession()
  if (session) redirect("/dashboard")

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <RegisterForm />
    </main>
  )
}
