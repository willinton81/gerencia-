import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import Ticket from "@/models/Ticket"
import { requireAuth } from "@/lib/api-auth"
import { serializeTicket } from "@/lib/serialize"
import {
  ROLES,
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORY,
  type TicketCategory,
  type TicketPriority,
} from "@/lib/roles"
import { rateLimit } from "@/lib/rate-limit"

// GET /api/tickets — Lista tiquetes según el rol del usuario.
export async function GET() {
  const auth = await requireAuth()
  if ("error" in auth) return auth.error
  const { session } = auth

  try {
    await dbConnect()

    let filter: Record<string, unknown> = {}
    if (session.role === ROLES.CLIENTE) {
      // El cliente solo ve sus propios tiquetes.
      filter = { client: session.userId }
    } else if (
      session.role === ROLES.TECNICO_CAMPO ||
      session.role === ROLES.LIDER_TECNICO
    ) {
      // Los técnicos ven los tiquetes asignados a ellos.
      filter = { assignedTo: session.userId }
    }
    // Mesa de Ayuda, Coordinador y Admin/Ventas ven todos (con sus propias vistas).

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).lean()
    // .lean() devuelve objetos planos; reconstruimos para serializar IDs a string.
    const serialized = tickets.map((t) =>
      serializeTicket(t as unknown as Parameters<typeof serializeTicket>[0]),
    )

    return NextResponse.json({ tickets: serialized })
  } catch (error) {
    console.log("[v0] Error al listar tiquetes:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener los tiquetes." }, { status: 500 })
  }
}

// POST /api/tickets — Crear un tiquete (solo clientes), con rate limiting.
export async function POST(request: NextRequest) {
  const auth = await requireAuth([ROLES.CLIENTE])
  if ("error" in auth) return auth.error
  const { session } = auth

  // Rate limiting por usuario para evitar saturación / bots.
  const limit = rateLimit(`ticket:${session.userId}`, 5, 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Has creado demasiados tiquetes muy rápido. Espera ${limit.retryAfterSeconds}s.`,
      },
      { status: 429 },
    )
  }

  try {
    const { title, description, category, priority } = await request.json()

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Título, descripción y categoría son obligatorios." },
        { status: 400 },
      )
    }

    if (!Object.values(TICKET_CATEGORY).includes(category as TicketCategory)) {
      return NextResponse.json({ error: "Categoría inválida." }, { status: 400 })
    }

    const safePriority =
      priority && Object.values(TICKET_PRIORITY).includes(priority as TicketPriority)
        ? priority
        : TICKET_PRIORITY.MEDIA

    await dbConnect()

    const ticket = await Ticket.create({
      title: String(title).trim(),
      description: String(description).trim(),
      category,
      priority: safePriority,
      status: TICKET_STATUS.ABIERTO,
      client: session.userId,
      clientName: session.name,
      logs: [
        {
          action: "Tiquete creado por el cliente",
          toStatus: TICKET_STATUS.ABIERTO,
          performedBy: session.userId,
          performedByName: session.name,
        },
      ],
    })

    return NextResponse.json({ ticket: serializeTicket(ticket) }, { status: 201 })
  } catch (error) {
    console.log("[v0] Error al crear tiquete:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el tiquete." }, { status: 500 })
  }
}
