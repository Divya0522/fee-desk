import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['parent', 'accounts', 'admin'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    centre: {
      type: String,
      default: 'ALL',
      trim: true,
    },
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    isActivated: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    studentIds: {
      type: [String],
      default: [],
      index: true,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    failedAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

export const User = mongoose.model('User', userSchema)
