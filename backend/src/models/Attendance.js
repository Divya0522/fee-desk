import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present',
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true })

export const Attendance = mongoose.model('Attendance', attendanceSchema)
