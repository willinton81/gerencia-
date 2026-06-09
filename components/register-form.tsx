"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { CLIENT_TYPE } from "@/lib/roles"
import { UserPlus, AlertCircle } from "lucide-react"

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"

export function RegisterForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    clientType: CLIENT_TYPE.INDEPENDIENTE as string,
    organization: "",
  })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!acceptedTerms) {
      setError("Debes aceptar el tratamiento de datos personales (Ley 1581 de 2012).")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, acceptedTerms }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "No se pudo crear la cuenta.")
        return
      }
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>
      <h1 className="mt-6 text-center text-2xl font-bold text-card-foreground">
        Crear cuenta de cliente
      </h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Registra tu organización para abrir tiquetes de soporte
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Nombre completo
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputClass}
            placeholder="Nombre y apellido"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className={inputClass}
            placeholder="tucorreo@ejemplo.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="clientType" className="text-sm font-medium text-foreground">
            Tipo de cliente
          </label>
          <select
            id="clientType"
            value={form.clientType}
            onChange={(e) => update("clientType", e.target.value)}
            className={inputClass}
          >
            {Object.values(CLIENT_TYPE).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="organization" className="text-sm font-medium text-foreground">
            Organización <span className="text-muted-foreground">(opcional)</span>
          </label>
          <input
            id="organization"
            type="text"
            value={form.organization}
            onChange={(e) => update("organization", e.target.value)}
            className={inputClass}
            placeholder="Nombre de tu empresa o institución"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className={inputClass}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <label className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/50 p-3">
          <input
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary"
          />
          <span className="text-sm leading-relaxed text-foreground">
            Acepto los Términos y Condiciones y autorizo el tratamiento de mis datos personales
            conforme a la <strong>Ley 1581 de 2012 (Habeas Data)</strong>.
          </span>
        </label>

        <Button type="submit" disabled={loading} className="mt-1 w-full">
          <UserPlus size={18} aria-hidden="true" />
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
