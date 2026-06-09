// Rate limiting básico en memoria para mitigar saturación por bots, según las
// políticas de buen uso. Para producción con múltiples instancias se recomienda
// usar un store distribuido (p. ej. Redis), pero esto cumple el alcance del MVP.

interface RateRecord {
  count: number
  resetAt: number
}

const store = new Map<string, RateRecord>()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const record = store.get(key)

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: limit - record.count,
    retryAfterSeconds: 0,
  }
}
