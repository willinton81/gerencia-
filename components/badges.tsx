import { TICKET_STATUS, TICKET_PRIORITY, type TicketStatus, type TicketPriority } from "@/lib/roles"

const STATUS_STYLES: Record<TicketStatus, string> = {
  [TICKET_STATUS.ABIERTO]: "bg-blue-100 text-blue-800 border-blue-200",
  [TICKET_STATUS.EN_DIAGNOSTICO]: "bg-amber-100 text-amber-800 border-amber-200",
  [TICKET_STATUS.RESUELTO]: "bg-emerald-100 text-emerald-800 border-emerald-200",
  [TICKET_STATUS.CERRADO]: "bg-slate-200 text-slate-700 border-slate-300",
}

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  [TICKET_PRIORITY.BAJA]: "bg-slate-100 text-slate-700 border-slate-200",
  [TICKET_PRIORITY.MEDIA]: "bg-sky-100 text-sky-800 border-sky-200",
  [TICKET_PRIORITY.ALTA]: "bg-orange-100 text-orange-800 border-orange-200",
  [TICKET_PRIORITY.CRITICA]: "bg-red-100 text-red-800 border-red-200",
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
    >
      {priority}
    </span>
  )
}
