import mongoose from 'mongoose'

const receiptSchema = new mongoose.Schema(
  {
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
    },
    taxableValuePaise: {
      type: Number,
      required: true,
      min: 0,
    },
    gstPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    gstRatePercent: {
      type: Number,
      default: 18,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

export const Receipt = mongoose.model('Receipt', receiptSchema)
