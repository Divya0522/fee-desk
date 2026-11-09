import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    centre: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    course: {
      type: String,
      enum: ['JEE', 'NEET'],
      required: true,
      index: true,
    },
    courseStart: {
      type: Date,
      required: true,
    },
    courseEnd: {
      type: Date,
      required: true,
    },
    guardianPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'left'],
      default: 'active',
      index: true,
    },
    leftOn: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

export const Student = mongoose.model('Student', studentSchema)
