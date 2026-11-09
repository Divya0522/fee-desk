import mongoose from 'mongoose'

const reminderLogSchema = new mongoose.Schema(
  {
    instalmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instalment',
      required: true,
      index: true,
    },
    offsetKey: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: String,
      default: 'sms',
      trim: true,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    status: {
      type: String,
      enum: ['scheduled', 'sent', 'skipped_paid', 'cancelled', 'skipped_no_optin'],
      required: true,
      index: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    messagePreview: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

reminderLogSchema.index({ instalmentId: 1, offsetKey: 1 }, { unique: true })

export const ReminderLog = mongoose.model('ReminderLog', reminderLogSchema)
