import { app } from './app.js'
import { connectDB, disconnectDB } from './config/db.js'
import { env } from './config/env.js'

async function startServer() {
  try {
    await connectDB()
    console.log(`Connected to MongoDB Atlas: ${env.MONGODB_URI.split('@')[1]?.split('?')[0] || 'connected'}`)

    const server = app.listen(env.PORT, () => {
      console.log(`FeeDesk Backend running on port ${env.PORT} [${env.NODE_ENV}]`)
    })

    const shutdown = async (signal) => {
      console.log(`Received ${signal}. Gracefully shutting down...`)
      server.close(async () => {
        await disconnectDB()
        console.log('MongoDB disconnected. Exiting.')
        process.exit(0)
      })
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Only start when invoked directly
if (process.env.NODE_ENV !== 'test') {
  startServer()
}
