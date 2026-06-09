"use client"

import Link from "next/link"
import type { SerializedTicket } from "@/lib/serialize"
import { StatusBadge, PriorityBadge } from "@/components/badges"
import { ChevronRight, Inbox } from "lucide-react"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function TicketList({
  tickets,
  emptyMessage = "No hay tiquetes para mostrar.",
}: {
  tickets: SerializedTicket[]
  emptyMessage?: string
}) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
        <Inbox size={32} className="text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {tickets.map((ticket) => (
        <li key={ticket._id}>
          <Link
            href={`/dashboard/tickets/${ticket._id}`}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-ring hover:shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <span className="text-xs text-muted-foreground">{ticket.category}</span>
              </div>
              <h3 className="mt-2 truncate font-medium text-card-foreground">
                {ticket.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cliente: {ticket.clientName}
                {ticket.assignedToName ? ` · Técnico: ${ticket.assignedToName}` : " · Sin asignar"}
                {" · "}
                {formatDate(ticket.createdAt)}
              </p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
