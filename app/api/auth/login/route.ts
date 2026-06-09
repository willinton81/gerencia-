import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import User from "@/models/User"
import { verifyPassword, createToken, setSessionCookie } from "@/lib/auth"
import { serializeUser } from "@/lib/serialize"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon"
  const limit = rateLimit(`login:${ip}`, 10, 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Demasiados intentos. Intenta de nuevo en ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    )
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo y contraseña son obligatorios." },
        { status: 400 },
      )
    }

    await dbConnect()

    const user = await User.findOne({ email: String(email).toLowerCase().trim() })
    // Mensaje genérico para no revelar si el correo existe.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 })
    }

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    })
    await setSessionCookie(token)

    return NextResponse.json({ user: serializeUser(user) }, { status: 200 })
  } catch (error) {
    console.log("[v0] Error en login:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error interno al iniciar sesión." }, { status: 500 })
  }
}
