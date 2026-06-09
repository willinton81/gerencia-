import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import Ticket from "@/models/Ticket"
import User from "@/models/User"
import { requireAuth } from "@/lib/api-auth"
import { serializeTicket } from "@/lib/serialize"
import { ROLES, TECH_ROLES, TICKET_STATUS, type TicketStatus } from "@/lib/roles"

const WARRANTY_DAYS = 30

// Transiciones válidas del flujo síncrono del MVP.
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TICKET_STATUS.ABIERTO]: [TICKET_STATUS.EN_DIAGNOSTICO],
  [TICKET_STATUS.EN_DIAGNOSTICO]: [TICKET_STATUS.RESUELTO],
  [TICKET_STATUS.RESUELTO]: [TICKET_STATUS.CERRADO],
  [TICKET_STATUS.CERRADO]: [],
}

// POST /api/tickets/[id]/action — Acciones de flujo según el tipo enviado.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth()
  if ("error" in auth) return auth.error
  const { session } = auth
  const { id } = await params

  try {
    const body = await request.json()
    const { type } = body

    await dbConnect()
    const ticket = await Ticket.findById(id)
    if (!ticket) {
      return NextResponse.json({ error: "Tiquete no encontrado." }, { status: 404 })
    }

    switch (type) {
      // ── Asignación de técnico (Mesa de Ayuda) ──────────────────────────
      case "assign": {
        if (session.role !== ROLES.MESA_AYUDA) {
          return NextResponse.json(
            { error: "Solo la Mesa de Ayuda puede asignar tiquetes." },
            { status: 403 },
          )
        }
        const { assignedToId } = body
        const tech = await User.findById(assignedToId)
        if (!tech || !TECH_ROLES.includes(tech.role)) {
          return NextResponse.json(
            { error: "Debes asignar a un técnico de Nivel 2 o Nivel 3." },
            { status: 400 },
          )
        }
        ticket.assignedTo = tech._id
        ticket.assignedToName = tech.name
        ticket.logs.push({
          action: `Tiquete asignado a ${tech.name}`,
          performedBy: session.userId,
          performedByName: session.name,
        } as never)
        break
      }

      // ── Cambio de estado (técnico asignado) ────────────────────────────
      case "status": {
        if (!TECH_ROLES.includes(session.role)) {
          return NextResponse.json(
            { error: "Solo los técnicos asignados pueden cambiar el estado." },
            { status: 403 },
          )
        }
        if (ticket.assignedTo?.toString() !== session.userId) {
          return NextResponse.json(
            { error: "No eres el técnico asignado a este tiquete." },
            { status: 403 },
          )
        }
        const { toStatus, note } = body
        const allowed = VALID_TRANSITIONS[ticket.status as TicketStatus] || []
        if (!allowed.includes(toStatus)) {
          return NextResponse.json(
            { error: `Transición inválida desde "${ticket.status}".` },
            { status: 400 },
          )
        }

        const fromStatus = ticket.status as TicketStatus
        ticket.status = toStatus

        if (toStatus === TICKET_STATUS.RESUELTO) {
          ticket.resolvedAt = new Date()
        }

        ticket.logs.push({
          action: `Estado cambiado de "${fromStatus}" a "${toStatus}"`,
          fromStatus,
          toStatus,
          performedBy: session.userId,
          performedByName: session.name,
          note: note ? String(note).trim() : undefined,
        } as never)
        break
      }

      // ── Generar Informe de Cierre (técnico asignado) ───────────────────
      case "closure": {
        if (!TECH_ROLES.includes(session.role)) {
          return NextResponse.json(
            { error: "Solo los técnicos pueden generar el informe de cierre." },
            { status: 403 },
          )
        }
        if (ticket.assignedTo?.toString() !== session.userId) {
          return NextResponse.json({ error: "No eres el técnico asignado." }, { status: 403 })
        }
        if (ticket.status !== TICKET_STATUS.RESUELTO) {
          return NextResponse.json(
            { error: "El tiquete debe estar Resuelto para generar el informe." },
            { status: 400 },
          )
        }
        const { summary } = body
        if (!summary || String(summary).trim().length < 10) {
          return NextResponse.json(
            { error: "El resumen del informe debe tener al menos 10 caracteres." },
            { status: 400 },
          )
        }
        ticket.closureReport = {
          summary: String(summary).trim(),
          generatedAt: new Date(),
          approvedByClient: false,
        }
        ticket.logs.push({
          action: "Informe de cierre generado",
          performedBy: session.userId,
          performedByName: session.name,
        } as never)
        break
      }

      // ── Aprobar Informe de Cierre (cliente o coordinador) ──────────────
      case "approve": {
        const isClientOwner =
          session.role === ROLES.CLIENTE && ticket.client.toString() === session.userId
        const isCoordinator = session.role === ROLES.COORDINADOR
        if (!isClientOwner && !isCoordinator) {
          return NextResponse.json(
            { error: "Solo el cliente dueño o el coordinador pueden aprobar el cierre." },
            { status: 403 },
          )
        }
        if (!ticket.closureReport) {
          return NextResponse.json(
            { error: "No hay informe de cierre para aprobar." },
            { status: 400 },
          )
        }
        if (ticket.closureReport.approvedByClient) {
          return NextResponse.json(
            { error: "El informe ya fue aprobado." },
            { status: 400 },
          )
        }

        const now = new Date()
        // Garantía legal: 30 días calendario posteriores al cierre.
        const warranty = new Date(now)
        warranty.setDate(warranty.getDate() + WARRANTY_DAYS)

        ticket.closureReport.approvedByClient = true
        ticket.closureReport.approvedAt = now
        ticket.closureReport.approvedByName = session.name
        ticket.closureReport.warrantyExpiresAt = warranty
        ticket.status = TICKET_STATUS.CERRADO
        ticket.closedAt = now

        ticket.logs.push({
          action: `Informe de cierre aprobado por ${session.name}. Garantía hasta ${warranty.toLocaleDateString("es-CO")}`,
          fromStatus: TICKET_STATUS.RESUELTO,
          toStatus: TICKET_STATUS.CERRADO,
          performedBy: session.userId,
          performedByName: session.name,
        } as never)
        break
      }

      default:
        return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 })
    }

    await ticket.save()
    return NextResponse.json({ ticket: serializeTicket(ticket) })
  } catch (error) {
    console.log("[v0] Error en acción de tiquete:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al procesar la acción." }, { status: 500 })
  }
}
