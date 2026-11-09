import express from 'express'
import {
  getParentStudents,
  getParentStudentLedger,
  getParentStudentReceipts,
  getParentStudentAttendance,
  getParentStudentScores,
  getParentStudentReminders,
  createInstalmentPayLink,
} from '../controllers/parentController.js'
import { requireAuth, requireRole, requireStudentAccess } from '../middleware/auth.js'

export const parentRouter = express.Router()

// All parent routes require authentication and parent or staff role
parentRouter.use(requireAuth, requireRole('parent', 'accounts', 'centre_admin', 'admin'))

parentRouter.get('/students', getParentStudents)
parentRouter.get('/students/:studentId/ledger', requireStudentAccess, getParentStudentLedger)
parentRouter.get('/students/:studentId/receipts', requireStudentAccess, getParentStudentReceipts)
parentRouter.get('/students/:studentId/attendance', requireStudentAccess, getParentStudentAttendance)
parentRouter.get('/students/:studentId/scores', requireStudentAccess, getParentStudentScores)
parentRouter.get('/students/:studentId/reminders', requireStudentAccess, getParentStudentReminders)
parentRouter.post('/instalments/:id/pay-link', createInstalmentPayLink)
