import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="min-h-dvh bg-background">
      <DashboardHeader name={session.name} role={session.role} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <DashboardClient
          role={session.role}
          userId={session.userId}
          name={session.name}
        />
      </main>
    </div>
  )
}
