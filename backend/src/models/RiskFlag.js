import mongoose from 'mongoose'

const reasonSubSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    label: { type: String, required: true },
    points: { type: Number, required: true },
  },
  { _id: false }
)

const riskFlagSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      index: true,
    },
    reasons: {
      type: [reasonSubSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['open', 'false_flag', 'contacted', 'resolved'],
      default: 'open',
      index: true,
    },
    counsellorNote: {
      type: String,
      default: '',
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

export const RiskFlag = mongoose.model('RiskFlag', riskFlagSchema)
