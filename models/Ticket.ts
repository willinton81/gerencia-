import mongoose, { Schema, model, models, type Model, type Document } from "mongoose"
import {
  TICKET_STATUS,
  TICKET_PRIORITY,
  TICKET_CATEGORY,
  type TicketStatus,
  type TicketPriority,
  type TicketCategory,
} from "@/lib/roles"

// Subesquema de Log de auditoría. Cada entrada es INMUTABLE: solo se agregan
// registros, nunca se editan ni se eliminan, para soportar reclamaciones directas.
export interface ITicketLog {
  _id: mongoose.Types.ObjectId
  action: string // Descripción legible del evento.
  fromStatus?: TicketStatus
  toStatus?: TicketStatus
  performedBy: mongoose.Types.ObjectId // Usuario que ejecuta la acción.
  performedByName: string // Nombre desnormalizado para trazabilidad histórica.
  note?: string
  createdAt: Date
}

const TicketLogSchema = new Schema<ITicketLog>(
  {
    action: { type: String, required: true },
    fromStatus: { type: String, enum: Object.values(TICKET_STATUS) },
    toStatus: { type: String, enum: Object.values(TICKET_STATUS) },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    performedByName: { type: String, required: true },
    note: { type: String },
    // createdAt actúa como sello de Fecha y Hora inmutable.
    createdAt: { type: Date, default: Date.now, immutable: true },
  },
  { _id: true },
)

// Informe de cierre con cálculo de garantía legal (30 días calendario).
export interface IClosureReport {
  summary: string // Diagnóstico y solución aplicada.
  generatedAt: Date
  approvedByClient: boolean
  approvedAt?: Date
  approvedByName?: string
  warrantyExpiresAt?: Date // closedAt + 30 días.
}

const ClosureReportSchema = new Schema<IClosureReport>(
  {
    summary: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    approvedByClient: { type: Boolean, default: false },
    approvedAt: { type: Date },
    approvedByName: { type: String },
    warrantyExpiresAt: { type: Date },
  },
  { _id: false },
)

export interface ITicket extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  client: mongoose.Types.ObjectId
  clientName: string
  assignedTo?: mongoose.Types.ObjectId
  assignedToName?: string
  logs: mongoose.Types.DocumentArray<ITicketLog>
  closureReport?: IClosureReport
  resolvedAt?: Date
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const TicketSchema = new Schema<ITicket>(
  {
    title: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "La descripción de la incidencia es obligatoria"],
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(TICKET_CATEGORY),
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TICKET_PRIORITY),
      default: TICKET_PRIORITY.MEDIA,
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.ABIERTO,
    },
    client: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clientName: { type: String, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    assignedToName: { type: String },
    logs: { type: [TicketLogSchema], default: [] },
    closureReport: { type: ClosureReportSchema },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true },
)

const Ticket: Model<ITicket> =
  (models.Ticket as Model<ITicket>) || model<ITicket>("Ticket", TicketSchema)

export default Ticket
