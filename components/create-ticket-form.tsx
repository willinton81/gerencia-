"use client"

import { useState } from "react"
import { useSWRConfig } from "swr"
import { Button } from "@/components/ui/button"
import { TICKET_CATEGORY, TICKET_PRIORITY } from "@/lib/roles"
import { Plus, AlertCircle, X } from "lucide-react"

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"

export function CreateTicketForm() {
  const { mutate } = useSWRConfig()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>(TICKET_CATEGORY.HARDWARE)
  const [priority, setPriority] = useState<string>(TICKET_PRIORITY.MEDIA)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, priority }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "No se pudo crear el tiquete.")
        return
      }
      // Refresca la lista de tiquetes.
      mutate("/api/tickets")
      setTitle("")
      setDescription("")
      setCategory(TICKET_CATEGORY.HARDWARE)
      setPriority(TICKET_PRIORITY.MEDIA)
      setOpen(false)
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus size={18} aria-hidden="true" />
        Nuevo tiquete
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">Crear nuevo tiquete</h2>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary"
          aria-label="Cerrar formulario"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium text-foreground">
            Título / Asunto
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Ej: El equipo no enciende"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-sm font-medium text-foreground">
              Categoría
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {Object.values(TICKET_CATEGORY).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="priority" className="text-sm font-medium text-foreground">
              Prioridad
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={inputClass}
            >
              {Object.values(TICKET_PRIORITY).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-foreground">
            Descripción de la incidencia
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} resize-y`}
            placeholder="Describe el problema físico o lógico con el mayor detalle posible."
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar tiquete"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
