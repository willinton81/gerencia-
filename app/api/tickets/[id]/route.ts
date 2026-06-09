import { NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import Ticket from "@/models/Ticket"
import { requireAuth } from "@/lib/api-auth"
import { serializeTicket } from "@/lib/serialize"
import { ROLES } from "@/lib/roles"

// GET /api/tickets/[id] — Detalle de un tiquete con control de acceso.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth()
  if ("error" in auth) return auth.error
  const { session } = auth

  const { id } = await params

  try {
    await dbConnect()
    const ticket = await Ticket.findById(id)
    if (!ticket) {
      return NextResponse.json({ error: "Tiquete no encontrado." }, { status: 404 })
    }

    // El cliente solo accede a sus tiquetes; el técnico, a los asignados.
    if (session.role === ROLES.CLIENTE && ticket.client.toString() !== session.userId) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 })
    }
    if (
      (session.role === ROLES.TECNICO_CAMPO || session.role === ROLES.LIDER_TECNICO) &&
      ticket.assignedTo?.toString() !== session.userId
    ) {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 })
    }

    return NextResponse.json({ ticket: serializeTicket(ticket) })
  } catch (error) {
    console.log("[v0] Error al obtener tiquete:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener el tiquete." }, { status: 500 })
  }
}
