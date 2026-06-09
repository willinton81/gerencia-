import type { ITicket, ITicketLog } from "@/models/Ticket"
import type { IUser } from "@/models/User"
import type { Role, TicketStatus, TicketPriority, TicketCategory, ClientType } from "@/lib/roles"

// Tipos serializables (planos) que se envían al cliente. Todos los ObjectId
// se convierten a string para evitar errores de hidratación en Next.js.

export interface SerializedUser {
  _id: string
  name: string
  email: string
  role: Role
  clientType?: ClientType
  organization?: string
  acceptedTerms: boolean
  createdAt: string
}

export interface SerializedTicketLog {
  _id: string
  action: string
  fromStatus?: TicketStatus
  toStatus?: TicketStatus
  performedBy: string
  performedByName: string
  note?: string
  createdAt: string
}

export interface SerializedClosureReport {
  summary: string
  generatedAt: string
  approvedByClient: boolean
  approvedAt?: string
  approvedByName?: string
  warrantyExpiresAt?: string
}

export interface SerializedTicket {
  _id: string
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  client: string
  clientName: string
  assignedTo?: string
  assignedToName?: string
  logs: SerializedTicketLog[]
  closureReport?: SerializedClosureReport
  resolvedAt?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
}

export function serializeUser(user: IUser): SerializedUser {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    clientType: user.clientType,
    organization: user.organization,
    acceptedTerms: user.acceptedTerms,
    createdAt: user.createdAt.toISOString(),
  }
}

function serializeLog(log: ITicketLog): SerializedTicketLog {
  return {
    _id: log._id.toString(),
    action: log.action,
    fromStatus: log.fromStatus,
    toStatus: log.toStatus,
    performedBy: log.performedBy.toString(),
    performedByName: log.performedByName,
    note: log.note,
    createdAt: new Date(log.createdAt).toISOString(),
  }
}

export function serializeTicket(ticket: ITicket): SerializedTicket {
  return {
    _id: ticket._id.toString(),
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    client: ticket.client.toString(),
    clientName: ticket.clientName,
    assignedTo: ticket.assignedTo ? ticket.assignedTo.toString() : undefined,
    assignedToName: ticket.assignedToName,
    logs: (ticket.logs ?? []).map(serializeLog),
    closureReport: ticket.closureReport
      ? {
          summary: ticket.closureReport.summary,
          generatedAt: new Date(ticket.closureReport.generatedAt).toISOString(),
          approvedByClient: ticket.closureReport.approvedByClient,
          approvedAt: ticket.closureReport.approvedAt
            ? new Date(ticket.closureReport.approvedAt).toISOString()
            : undefined,
          approvedByName: ticket.closureReport.approvedByName,
          warrantyExpiresAt: ticket.closureReport.warrantyExpiresAt
            ? new Date(ticket.closureReport.warrantyExpiresAt).toISOString()
            : undefined,
        }
      : undefined,
    resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : undefined,
    closedAt: ticket.closedAt ? ticket.closedAt.toISOString() : undefined,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  }
}
