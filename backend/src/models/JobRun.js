import mongoose from 'mongoose'

const jobRunSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      enum: ['reminders', 'risk_scoring'],
    },
    status: {
      type: String,
      enum: ['running', 'success', 'failed'],
      default: 'running',
      index: true,
    },
    triggeredBy: {
      type: String,
      default: 'system',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    finishedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    resultSummary: {
      type: String,
      default: '',
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

export const JobRun = mongoose.model('JobRun', jobRunSchema)
