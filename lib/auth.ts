import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import type { Role } from "@/lib/roles"

// Resolución perezosa del secreto: NO lanzamos error al importar el módulo,
// para que las páginas públicas (landing, login) puedan renderizar aunque
// JWT_SECRET aún no esté configurado. El error solo ocurre al firmar/verificar
// un token en producción sin secreto.
let cachedSecretKey: Uint8Array | null = null

function getSecretKey(): Uint8Array {
  if (cachedSecretKey) return cachedSecretKey
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Falta la variable de entorno JWT_SECRET. Configúrala con una cadena segura aleatoria.",
      )
    }
    // Fallback solo para desarrollo/preview cuando aún no se configura el secreto.
    cachedSecretKey = new TextEncoder().encode("dev-only-insecure-secret-change-me")
    return cachedSecretKey
  }
  cachedSecretKey = new TextEncoder().encode(secret)
  return cachedSecretKey
}

const COOKIE_NAME = "st_session"
const SESSION_DURATION_SECONDS = 60 * 60 * 8 // 8 horas

export interface SessionPayload extends JWTPayload {
  userId: string
  email: string
  name: string
  role: Role
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: {
  userId: string
  email: string
  name: string
  role: Role
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey())
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Devuelve la sesión actual leyendo y verificando la cookie. null si no hay sesión.
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export { COOKIE_NAME }
