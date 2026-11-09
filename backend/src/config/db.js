import mongoose from 'mongoose'
import { env } from './env.js'

let isConnected = false

export async function connectDB(uri = env.MONGODB_URI) {
  if (isConnected) return mongoose.connection

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    })
    isConnected = true
    return conn.connection
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

export async function disconnectDB() {
  if (!isConnected) return
  await mongoose.disconnect()
  isConnected = false
}
