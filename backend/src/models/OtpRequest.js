import mongoose from 'mongoose'

const otpRequestSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

// TTL index to automatically delete expired OTP records
otpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const OtpRequest = mongoose.model('OtpRequest', otpRequestSchema)
