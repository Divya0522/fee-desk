import mongoose from 'mongoose'

const refundRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    leaveDate: {
      type: Date,
      required: true,
    },
    breakdown: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    refundPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['calculated', 'approved', 'paid', 'rejected'],
      default: 'calculated',
      index: true,
    },
    policyVersion: {
      type: String,
      default: 'v1.0',
    },
    payoutDueBy: {
      type: Date,
      required: true,
      index: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

export const RefundRequest = mongoose.model('RefundRequest', refundRequestSchema)
