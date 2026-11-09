import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: '',
      index: true,
    },
    actor: {
      type: String,
      default: 'system',
      index: true,
    },
    performedBy: {
      type: String,
      default: 'system',
      index: true,
    },
    summary: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
)

export const AuditLog = mongoose.model('AuditLog', auditLogSchema)
