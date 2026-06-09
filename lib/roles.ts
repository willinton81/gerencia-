// Definición central de roles (RBAC) para ST Soluciones Tecnológicas.
// Se mantiene en un único lugar para cumplir el principio SOLID de fuente única de verdad.

export const ROLES = {
  CLIENTE: "cliente",
  MESA_AYUDA: "mesa_ayuda", // Nivel 1 - Blanca Cortés
  TECNICO_CAMPO: "tecnico_campo", // Nivel 2 - Diana Díez
  LIDER_TECNICO: "lider_tecnico", // Nivel 3 - Pedro Romero
  COORDINADOR: "coordinador", // Coordinador / Gerente - Willinton Peña / Camilo Ovalle
  ADMIN_VENTAS: "admin_ventas", // Administración y Ventas - Carlos Méndez
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.CLIENTE]: "Cliente",
  [ROLES.MESA_AYUDA]: "Mesa de Ayuda (Nivel 1)",
  [ROLES.TECNICO_CAMPO]: "Técnico de Campo (Nivel 2)",
  [ROLES.LIDER_TECNICO]: "Líder Técnico (Nivel 3)",
  [ROLES.COORDINADOR]: "Coordinador de Operaciones",
  [ROLES.ADMIN_VENTAS]: "Administración y Ventas",
}

// Roles que pueden actuar como técnicos asignables a un tiquete.
export const TECH_ROLES: Role[] = [ROLES.TECNICO_CAMPO, ROLES.LIDER_TECNICO]

// Roles del personal interno (no clientes).
export const STAFF_ROLES: Role[] = [
  ROLES.MESA_AYUDA,
  ROLES.TECNICO_CAMPO,
  ROLES.LIDER_TECNICO,
  ROLES.COORDINADOR,
  ROLES.ADMIN_VENTAS,
]

export const ALL_ROLES: Role[] = [ROLES.CLIENTE, ...STAFF_ROLES]

// Estados del ciclo de vida de un tiquete (flujo síncrono del MVP).
export const TICKET_STATUS = {
  ABIERTO: "Abierto",
  EN_DIAGNOSTICO: "En Diagnóstico",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
} as const

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS]

export const TICKET_PRIORITY = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  CRITICA: "Crítica",
} as const

export type TicketPriority = (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY]

export const TICKET_CATEGORY = {
  HARDWARE: "Hardware (Soporte Físico)",
  SOFTWARE: "Software (Soporte Lógico)",
  REDES: "Redes y Conectividad",
  SERVIDORES: "Servidores e Infraestructura",
  MANTENIMIENTO: "Mantenimiento Preventivo",
  OTRO: "Otro",
} as const

export type TicketCategory = (typeof TICKET_CATEGORY)[keyof typeof TICKET_CATEGORY]

export const CLIENT_TYPE = {
  INDEPENDIENTE: "Persona Independiente",
  PYME: "PYME",
  EMPRENDIMIENTO: "Emprendimiento",
  EDUCATIVA: "Institución Educativa",
} as const

export type ClientType = (typeof CLIENT_TYPE)[keyof typeof CLIENT_TYPE]
