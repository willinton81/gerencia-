import mongoose, { Schema, model, models, type Model, type Document } from "mongoose"
import { ALL_ROLES, ROLES, CLIENT_TYPE, type Role, type ClientType } from "@/lib/roles"

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  passwordHash: string
  role: Role
  // Datos específicos del cliente (opcionales para el personal interno).
  clientType?: ClientType
  organization?: string
  // Cumplimiento Ley 1581 de 2012 (Habeas Data).
  acceptedTerms: boolean
  acceptedTermsAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Correo electrónico inválido"],
    },
    passwordHash: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
    },
    role: {
      type: String,
      enum: ALL_ROLES,
      required: true,
      default: ROLES.CLIENTE,
    },
    clientType: {
      type: String,
      enum: Object.values(CLIENT_TYPE),
    },
    organization: {
      type: String,
      trim: true,
    },
    acceptedTerms: {
      type: Boolean,
      required: true,
      default: false,
    },
    acceptedTermsAt: {
      type: Date,
    },
  },
  { timestamps: true },
)

const User: Model<IUser> = (models.User as Model<IUser>) || model<IUser>("User", UserSchema)

export default User
