import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    instalmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Instalment',
      default: null,
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
    method: {
      type: String,
      enum: ['upi', 'card', 'cash', 'gateway_test'],
      required: true,
    },
    gatewayRef: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed'],
      default: 'success',
      index: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      default: 'payment_link',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

export const Payment = mongoose.model('Payment', paymentSchema)
