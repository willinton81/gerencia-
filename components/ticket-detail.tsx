"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import type { SerializedTicket } from "@/lib/serialize"
import { Button } from "@/components/ui/button"
import { StatusBadge, PriorityBadge } from "@/components/badges"
import {
  ROLES,
  TECH_ROLES,
  TICKET_STATUS,
  type Role,
} from "@/lib/roles"
import {
  ArrowLeft,
  History,
  ShieldCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react"

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface Technician {
  _id: string
  name: string
  role: string
}

export function TicketDetail({
  initialTicket,
  role,
  userId,
}: {
  initialTicket: SerializedTicket
  role: Role
  userId: string
}) {
  const { data, mutate } = useSWR<{ ticket: SerializedTicket }>(
    `/api/tickets/${initialTicket._id}`,
    fetcher,
    { fallbackData: { ticket: initialTicket } },
  )
  const ticket = data?.ticket ?? initialTicket

  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function runAction(payload: Record<string, unknown>) {
    setActionError(null)
    setBusy(true)
    try {
      const res = await fetch(`/api/tickets/${ticket._id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!res.ok) {
        setActionError(result.error || "No se pudo completar la acción.")
        return false
      }
      await mutate({ ticket: result.ticket }, { revalidate: false })
      return true
    } catch {
      setActionError("Error de conexión.")
      return false
    } finally {
      setBusy(false)
    }
  }

  const isAssignedTech = TECH_ROLES.includes(role) && ticket.assignedTo === userId
  const isClientOwner = role === ROLES.CLIENTE && ticket.client === userId

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Volver al panel
      </Link>

      {/* Encabezado del tiquete */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="text-xs text-muted-foreground">{ticket.category}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-card-foreground">{ticket.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {ticket.description}
        </p>
        <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Cliente</dt>
            <dd className="font-medium text-foreground">{ticket.clientName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Técnico asignado</dt>
            <dd className="font-medium text-foreground">
              {ticket.assignedToName ?? "Sin asignar"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Creado</dt>
            <dd className="font-medium text-foreground">{formatDateTime(ticket.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {actionError && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Panel de acciones según rol */}
      {role === ROLES.MESA_AYUDA && (
        <AssignPanel ticket={ticket} busy={busy} onAssign={runAction} />
      )}

      {isAssignedTech && (
        <TechPanel ticket={ticket} busy={busy} onAction={runAction} />
      )}

      {/* Informe de cierre */}
      {ticket.closureReport && (
        <ClosureReportCard
          ticket={ticket}
          canApprove={
            !ticket.closureReport.approvedByClient &&
            (isClientOwner || role === ROLES.COORDINADOR)
          }
          busy={busy}
          onApprove={() => runAction({ type: "approve" })}
        />
      )}

      {/* Bitácora de auditoría inmutable */}
      <AuditLog ticket={ticket} />
    </div>
  )
}

// ── Panel: Mesa de Ayuda asigna técnico ──────────────────────────────────
function AssignPanel({
  ticket,
  busy,
  onAssign,
}: {
  ticket: SerializedTicket
  busy: boolean
  onAssign: (payload: Record<string, unknown>) => Promise<boolean>
}) {
  const { data } = useSWR<{ technicians: Technician[] }>(
    "/api/users/technicians",
    fetcher,
  )
  const [selected, setSelected] = useState("")

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
        <FileText size={18} className="text-primary" aria-hidden="true" />
        Asignación de técnico
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Selecciona el técnico de Nivel 2 (campo) o Nivel 3 (líder) según la naturaleza del caso.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={inputClass}
          aria-label="Seleccionar técnico"
        >
          <option value="">— Selecciona un técnico —</option>
          {(data?.technicians ?? []).map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
              {t.role === ROLES.LIDER_TECNICO ? " (Líder N3)" : " (Técnico N2)"}
            </option>
          ))}
        </select>
        <Button
          disabled={busy || !selected}
          onClick={() => onAssign({ type: "assign", assignedToId: selected })}
        >
          {ticket.assignedTo ? "Reasignar" : "Asignar"}
        </Button>
      </div>
    </div>
  )
}

// ── Panel: Técnico cambia estados y genera informe ───────────────────────
function TechPanel({
  ticket,
  busy,
  onAction,
}: {
  ticket: SerializedTicket
  busy: boolean
  onAction: (payload: Record<string, unknown>) => Promise<boolean>
}) {
  const [note, setNote] = useState("")
  const [summary, setSummary] = useState("")

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
        <Clock size={18} className="text-primary" aria-hidden="true" />
        Gestión del caso
      </h2>

      {ticket.status === TICKET_STATUS.ABIERTO && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Inicia el diagnóstico de este tiquete para comenzar la atención.
          </p>
          <Button
            className="mt-3"
            disabled={busy}
            onClick={() => onAction({ type: "status", toStatus: TICKET_STATUS.EN_DIAGNOSTICO })}
          >
            Iniciar diagnóstico
          </Button>
        </div>
      )}

      {ticket.status === TICKET_STATUS.EN_DIAGNOSTICO && (
        <div className="mt-4 flex flex-col gap-3">
          <label htmlFor="note" className="text-sm font-medium text-foreground">
            Bitácora de servicio (opcional)
          </label>
          <textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${inputClass} resize-y`}
            placeholder="Describe el trabajo realizado o la solución aplicada."
          />
          <Button
            disabled={busy}
            onClick={async () => {
              const ok = await onAction({
                type: "status",
                toStatus: TICKET_STATUS.RESUELTO,
                note,
              })
              if (ok) setNote("")
            }}
          >
            Marcar como Resuelto
          </Button>
        </div>
      )}

      {ticket.status === TICKET_STATUS.RESUELTO && !ticket.closureReport && (
        <div className="mt-4 flex flex-col gap-3">
          <label htmlFor="summary" className="text-sm font-medium text-foreground">
            Informe de cierre
          </label>
          <textarea
            id="summary"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className={`${inputClass} resize-y`}
            placeholder="Resumen del diagnóstico, solución aplicada y recomendaciones."
          />
          <Button
            disabled={busy}
            onClick={async () => {
              const ok = await onAction({ type: "closure", summary })
              if (ok) setSummary("")
            }}
          >
            Generar informe de cierre
          </Button>
        </div>
      )}

      {(ticket.status === TICKET_STATUS.RESUELTO && ticket.closureReport) ||
      ticket.status === TICKET_STATUS.CERRADO ? (
        <p className="mt-4 text-sm text-muted-foreground">
          El informe de cierre ya fue generado. A la espera de aprobación del cliente o coordinador.
        </p>
      ) : null}
    </div>
  )
}

// ── Tarjeta: Informe de cierre y garantía ────────────────────────────────
function ClosureReportCard({
  ticket,
  canApprove,
  busy,
  onApprove,
}: {
  ticket: SerializedTicket
  canApprove: boolean
  busy: boolean
  onApprove: () => void
}) {
  const report = ticket.closureReport!
  return (
    <div className="rounded-xl border border-primary/30 bg-secondary/40 p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
        <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
        Informe de cierre
      </h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {report.summary}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Generado el {formatDateTime(report.generatedAt)}
      </p>

      {report.approvedByClient ? (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 size={16} aria-hidden="true" />
            Aprobado por {report.approvedByName} el{" "}
            {report.approvedAt ? formatDateTime(report.approvedAt) : ""}
          </div>
          {report.warrantyExpiresAt && (
            <p className="text-sm text-emerald-800">
              <strong>Garantía legal vigente hasta:</strong>{" "}
              {new Date(report.warrantyExpiresAt).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}{" "}
              (30 días calendario).
            </p>
          )}
        </div>
      ) : canApprove ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Al aprobar, el caso se cerrará y se activará la garantía legal de 30 días calendario.
          </p>
          <Button className="mt-3" disabled={busy} onClick={onApprove}>
            <CheckCircle2 size={18} aria-hidden="true" />
            Aprobar y cerrar caso
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Pendiente de aprobación por el cliente o el coordinador de operaciones.
        </p>
      )}
    </div>
  )
}

// ── Bitácora de auditoría (logs inmutables) ──────────────────────────────
function AuditLog({ ticket }: { ticket: SerializedTicket }) {
  const logs = [...ticket.logs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
        <History size={18} className="text-primary" aria-hidden="true" />
        Bitácora de auditoría
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Registro inmutable de todos los eventos del tiquete (para reclamaciones).
      </p>
      <ol className="mt-5 flex flex-col gap-0">
        {logs.map((log, idx) => (
          <li key={log._id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
              {idx < logs.length - 1 && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="pb-5">
              <p className="text-sm font-medium text-foreground">{log.action}</p>
              {log.note && (
                <p className="mt-1 text-sm text-muted-foreground">{log.note}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {log.performedByName} · {formatDateTime(log.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
