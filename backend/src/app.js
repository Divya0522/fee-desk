import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import { env } from './config/env.js'
import { globalLimiter } from './middleware/rateLimit.js'
import { errorHandler } from './middleware/errorHandler.js'
import { successResponse } from './utils/response.js'
import { authRouter } from './routes/authRoutes.js'
import { dashboardRouter } from './routes/dashboardRoutes.js'
import { studentRouter } from './routes/studentRoutes.js'
import { refundRouter } from './routes/refundRoutes.js'
import { paymentRouter } from './routes/paymentRoutes.js'
import { riskRouter } from './routes/riskRoutes.js'
import { reminderRouter } from './routes/reminderRoutes.js'
import { parentRouter } from './routes/parentRoutes.js'
import { policyRouter } from './routes/policyRoutes.js'
import { adminRouter } from './routes/adminRoutes.js'
import { runRemindersJob } from './controllers/reminderController.js'
import { requireAuth, requireRole } from './middleware/auth.js'

export const app = express()

// Security HTTP headers
app.use(helmet())

// Cross-Origin Resource Sharing with credentials
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching CLIENT_URL
      if (!origin || origin === env.CLIENT_URL || env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        callback(new Error('Blocked by CORS policy'))
      }
    },
    credentials: true,
  })
)

// Global rate limiting
app.use(globalLimiter)

// Logging (concise in non-test)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

// Request parsers
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: '100kb' }))
app.use(cookieParser())

// Health check endpoint
app.get('/api/health', (req, res) => {
  return successResponse(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  })
})

// Authentication API routes
app.use('/api/auth', authRouter)

// Public Policy Documentation (Refund policy, DPDP privacy)
app.use('/api/policy', policyRouter)

// Parent Portal Domain Routes
app.use('/api/parent', parentRouter)

// Staff Accounts Domain Routes
app.use('/api/dashboard', dashboardRouter)
app.use('/api/students', studentRouter)
app.use('/api/refunds', refundRouter)
app.use('/api/payments', paymentRouter)
app.use('/api/risk-flags', riskRouter)
app.use('/api/reminders', reminderRouter)

// Admin Jobs endpoint called by staffApi (accessible to accounts & admin)
app.post('/api/admin/jobs/reminders/run', requireAuth, requireRole('accounts', 'admin'), runRemindersJob)

// Admin Domain Routes (admin only)
app.use('/api/admin', adminRouter)

// Central error handler
app.use(errorHandler)
