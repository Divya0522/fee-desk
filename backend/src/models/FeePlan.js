import mongoose from 'mongoose'

const feePlanSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    totalFeePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    instalmentCount: {
      type: Number,
      enum: [3, 4],
      default: 3,
    },
    gstInclusive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

export const FeePlan = mongoose.model('FeePlan', feePlanSchema)
