import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import User from "@/models/User"
import { hashPassword, createToken, setSessionCookie } from "@/lib/auth"
import { serializeUser } from "@/lib/serialize"
import { ROLES, CLIENT_TYPE, type ClientType } from "@/lib/roles"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  // Rate limiting por IP para el registro.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon"
  const limit = rateLimit(`register:${ip}`, 5, 60 * 1000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Demasiados intentos. Intenta de nuevo en ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    )
  }

  try {
    const body = await request.json()
    const { name, email, password, clientType, organization, acceptedTerms } = body

    // Validación de entrada.
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, correo y contraseña son obligatorios." },
        { status: 400 },
      )
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 },
      )
    }

    // Habeas Data (Ley 1581 de 2012): aceptación obligatoria.
    if (acceptedTerms !== true) {
      return NextResponse.json(
        {
          error:
            "Debes aceptar los Términos y el tratamiento de datos personales (Ley 1581 de 2012).",
        },
        { status: 400 },
      )
    }

    if (clientType && !Object.values(CLIENT_TYPE).includes(clientType as ClientType)) {
      return NextResponse.json({ error: "Tipo de cliente inválido." }, { status: 400 })
    }

    await dbConnect()

    const normalizedEmail = String(email).toLowerCase().trim()
    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este correo." },
        { status: 409 },
      )
    }

    const passwordHash = await hashPassword(password)

    // El registro público SIEMPRE crea clientes. Las cuentas internas se crean por seed/admin.
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.CLIENTE,
      clientType: clientType || CLIENT_TYPE.INDEPENDIENTE,
      organization: organization ? String(organization).trim() : undefined,
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
    })

    const token = await createToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    })
    await setSessionCookie(token)

    return NextResponse.json({ user: serializeUser(user) }, { status: 201 })
  } catch (error) {
    console.log("[v0] Error en registro:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: "Error interno al crear la cuenta." },
      { status: 500 },
    )
  }
}
