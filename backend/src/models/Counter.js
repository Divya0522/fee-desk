import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

/**
 * Atomically increments counter and returns the new sequence number
 */
counterSchema.statics.getNextSequence = async function (counterId) {
  const result = await this.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )
  return result.seq
}

export const Counter = mongoose.model('Counter', counterSchema)
