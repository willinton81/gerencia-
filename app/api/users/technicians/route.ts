import { NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import User from "@/models/User"
import { requireAuth } from "@/lib/api-auth"
import { ROLES, TECH_ROLES } from "@/lib/roles"

// GET /api/users/technicians — Lista de técnicos asignables (Mesa de Ayuda).
export async function GET() {
  const auth = await requireAuth([ROLES.MESA_AYUDA])
  if ("error" in auth) return auth.error

  try {
    await dbConnect()
    const techs = await User.find({ role: { $in: TECH_ROLES } })
      .select("name role")
      .lean()

    const serialized = techs.map((t) => ({
      _id: (t._id as { toString(): string }).toString(),
      name: t.name as string,
      role: t.role as string,
    }))

    return NextResponse.json({ technicians: serialized })
  } catch (error) {
    console.log("[v0] Error al listar técnicos:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al obtener técnicos." }, { status: 500 })
  }
}
