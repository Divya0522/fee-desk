import mongoose from 'mongoose'

const testScoreSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

testScoreSchema.index({ studentId: 1, testName: 1, date: 1 }, { unique: true })

export const TestScore = mongoose.model('TestScore', testScoreSchema)
