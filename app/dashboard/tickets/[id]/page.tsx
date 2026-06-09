import { redirect, notFound } from "next/navigation"
import { getSession } from "@/lib/auth"
import dbConnect from "@/lib/dbConnect"
import Ticket from "@/models/Ticket"
import { serializeTicket } from "@/lib/serialize"
import { ROLES } from "@/lib/roles"
import { DashboardHeader } from "@/components/dashboard-header"
import { TicketDetail } from "@/components/ticket-detail"

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { id } = await params

  await dbConnect()
  const ticketDoc = await Ticket.findById(id).catch(() => null)
  if (!ticketDoc) notFound()

  // Control de acceso a nivel de servidor.
  if (
    session.role === ROLES.CLIENTE &&
    ticketDoc.client.toString() !== session.userId
  ) {
    redirect("/dashboard")
  }
  if (
    (session.role === ROLES.TECNICO_CAMPO || session.role === ROLES.LIDER_TECNICO) &&
    ticketDoc.assignedTo?.toString() !== session.userId
  ) {
    redirect("/dashboard")
  }

  // Serialización: _id (ObjectId) -> string para evitar errores de hidratación.
  const ticket = serializeTicket(ticketDoc)

  return (
    <div className="min-h-dvh bg-background">
      <DashboardHeader name={session.name} role={session.role} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <TicketDetail
          initialTicket={ticket}
          role={session.role}
          userId={session.userId}
        />
      </main>
    </div>
  )
}
