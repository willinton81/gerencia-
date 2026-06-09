"use client"

import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import type { SerializedTicket } from "@/lib/serialize"
import { ROLES, TICKET_STATUS, ROLE_LABELS, type Role } from "@/lib/roles"
import { TicketList } from "@/components/ticket-list"
import { CreateTicketForm } from "@/components/create-ticket-form"
import { AlertCircle, Loader2 } from "lucide-react"

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

const HEADINGS: Record<Role, { title: string; subtitle: string }> = {
  [ROLES.CLIENTE]: {
    title: "Mis tiquetes",
    subtitle: "Crea nuevas solicitudes y revisa el estado de tus casos.",
  },
  [ROLES.MESA_AYUDA]: {
    title: "Cola de tiquetes",
    subtitle: "Prioriza y asigna los casos entrantes a los técnicos correspondientes.",
  },
  [ROLES.TECNICO_CAMPO]: {
    title: "Mis asignaciones",
    subtitle: "Atiende los tiquetes de soporte y mantenimiento que tienes asignados.",
  },
  [ROLES.LIDER_TECNICO]: {
    title: "Mis asignaciones",
    subtitle: "Atiende contingencias críticas de infraestructura, redes y servidores.",
  },
  [ROLES.COORDINADOR]: {
    title: "Supervisión global",
    subtitle: "Visualiza el estado de todos los tiquetes y aprueba informes de cierre.",
  },
  [ROLES.ADMIN_VENTAS]: {
    title: "Informes de cierre aprobados",
    subtitle: "Consulta los casos cerrados con garantía para procesar la facturación.",
  },
}

export function DashboardClient({ role }: { role: Role; userId: string; name: string }) {
  const { data, error, isLoading } = useSWR<{ tickets: SerializedTicket[] }>(
    "/api/tickets",
    fetcher,
  )

  const heading = HEADINGS[role]
  let tickets = data?.tickets ?? []

  // Admin/Ventas solo ve los tiquetes cerrados con informe aprobado.
  if (role === ROLES.ADMIN_VENTAS) {
    tickets = tickets.filter((t) => t.closureReport?.approvedByClient)
  }

  const stats = {
    total: tickets.length,
    abiertos: tickets.filter((t) => t.status === TICKET_STATUS.ABIERTO).length,
    enProceso: tickets.filter((t) => t.status === TICKET_STATUS.EN_DIAGNOSTICO).length,
    resueltos: tickets.filter((t) => t.status === TICKET_STATUS.RESUELTO).length,
    cerrados: tickets.filter((t) => t.status === TICKET_STATUS.CERRADO).length,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-primary">
          {ROLE_LABELS[role]}
        </span>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{heading.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{heading.subtitle}</p>
          </div>
          {role === ROLES.CLIENTE && <CreateTicketForm />}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <StatCard label="Total" value={stats.total} tone="text-foreground" />
        <StatCard label="Abiertos" value={stats.abiertos} tone="text-blue-600" />
        <StatCard label="En diagnóstico" value={stats.enProceso} tone="text-amber-600" />
        <StatCard label="Resueltos" value={stats.resueltos} tone="text-emerald-600" />
        <StatCard label="Cerrados" value={stats.cerrados} tone="text-slate-600" />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error.message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" aria-hidden="true" />
          Cargando tiquetes...
        </div>
      ) : (
        <TicketList
          tickets={tickets}
          emptyMessage={
            role === ROLES.CLIENTE
              ? "Aún no has creado tiquetes. Usa el botón 'Nuevo tiquete'."
              : "No hay tiquetes en esta vista por ahora."
          }
        />
      )}
    </div>
  )
}
