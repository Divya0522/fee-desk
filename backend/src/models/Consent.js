import mongoose from 'mongoose'

const consentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    guardianName: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      required: true,
      trim: true,
    },
    policyVersion: {
      type: String,
      default: 'v1.0',
    },
    consentedAt: {
      type: Date,
      default: Date.now,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    reminderOptIn: {
      type: Boolean,
      default: false,
    },
    withdrawnAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

export const Consent = mongoose.model('Consent', consentSchema)
