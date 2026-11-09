import mongoose from 'mongoose'

const unmatchedPaymentSchema = new mongoose.Schema(
  {
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'matched', 'rejected'],
      default: 'open',
      index: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

export const UnmatchedPayment = mongoose.model('UnmatchedPayment', unmatchedPaymentSchema)
