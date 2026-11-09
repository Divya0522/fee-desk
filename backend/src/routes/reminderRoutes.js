import express from 'express'
import { getReminders, runRemindersJob } from '../controllers/reminderController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const reminderRouter = express.Router()

// All reminder endpoints require staff role ('accounts', 'admin', 'centre_admin')
reminderRouter.use(requireAuth, requireRole('accounts'))

reminderRouter.get('/', getReminders)
reminderRouter.post('/run', runRemindersJob)
