import mongoose from "mongoose"

// Conexión a MongoDB con cacheo global para evitar abrir múltiples conexiones
// durante el hot-reload de Next.js (App Router / serverless).

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    "Falta la variable de entorno MONGODB_URI. Configúrala con tu cadena de conexión de MongoDB.",
  )
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// Usamos una variable global para preservar la conexión entre invocaciones.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
}

if (!global._mongooseCache) {
  global._mongooseCache = cached
}

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((m) => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    throw error
  }

  return cached.conn
}

export default dbConnect
