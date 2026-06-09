import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Logo } from "@/components/logo"
import { buttonVariants } from "@/components/ui/button"
import {
  Ticket,
  ShieldCheck,
  Network,
  Wrench,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react"

export default async function HomePage() {
  // Si ya hay sesión, lo enviamos a su panel.
  const session = await getSession()
  if (session) redirect("/dashboard")

  const features = [
    {
      icon: Ticket,
      title: "Gestión de Tiquetes",
      desc: "Crea y rastrea incidencias físicas o lógicas con categorías y prioridades claras.",
    },
    {
      icon: Network,
      title: "Asignación por Niveles",
      desc: "La Mesa de Ayuda enruta cada caso al técnico de Nivel 2 o Líder de Nivel 3 indicado.",
    },
    {
      icon: ClipboardCheck,
      title: "Bitácora Auditable",
      desc: "Cada cambio de estado queda registrado con fecha, hora y usuario, de forma inmutable.",
    },
    {
      icon: ShieldCheck,
      title: "Garantía Legal",
      desc: "Al cerrar el caso se calcula automáticamente la garantía de 30 días calendario.",
    },
  ]

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Iniciar sesión
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              <Wrench size={14} aria-hidden="true" />
              Soporte técnico profesional
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Plataforma de gestión de soporte de ST Soluciones Tecnológicas
            </h1>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              Centraliza la atención de incidentes de hardware, software, redes e infraestructura.
              Flujo trazable desde la apertura del tiquete hasta el informe de cierre con garantía.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className={buttonVariants({ size: "lg" })}>
                Crear cuenta de cliente
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Acceso del personal
              </Link>
            </div>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
                  <f.icon size={22} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-muted-foreground">
          ST Soluciones Tecnológicas · Tratamiento de datos conforme a la Ley 1581 de 2012
          (Habeas Data).
        </div>
      </footer>
    </div>
  )
}
