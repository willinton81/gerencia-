import { CircuitBoard } from "lucide-react"

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dimensions = {
    sm: { box: "h-8 w-8", icon: 18, text: "text-base" },
    md: { box: "h-10 w-10", icon: 22, text: "text-lg" },
    lg: { box: "h-12 w-12", icon: 26, text: "text-xl" },
  }[size]

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex ${dimensions.box} items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm`}
      >
        <CircuitBoard size={dimensions.icon} aria-hidden="true" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`font-semibold ${dimensions.text} text-foreground`}>
          ST Soluciones
        </span>
        <span className="text-xs font-medium text-muted-foreground">Tecnológicas</span>
      </div>
    </div>
  )
}
