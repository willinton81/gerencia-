import { NextResponse } from "next/server"
import { getSession, type SessionPayload } from "@/lib/auth"
import type { Role } from "@/lib/roles"

// Helper de autorización para API Routes. Verifica la sesión y, opcionalmente,
// que el rol del usuario esté dentro de los roles permitidos.
export async function requireAuth(
  allowedRoles?: Role[],
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const session = await getSession()

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "No autenticado. Inicia sesión para continuar." },
        { status: 401 },
      ),
    }
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      error: NextResponse.json(
        { error: "No autorizado. Tu rol no tiene permisos para esta acción." },
        { status: 403 },
      ),
    }
  }

  return { session }
}
