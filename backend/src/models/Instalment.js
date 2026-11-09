import mongoose from 'mongoose'

const instalmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeePlan',
      required: true,
      index: true,
    },
    sequence: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    paidPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentLinkToken: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

instalmentSchema.index({ studentId: 1, sequence: 1 }, { unique: true })

export const Instalment = mongoose.model('Instalment', instalmentSchema)
