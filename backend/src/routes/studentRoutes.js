import express from 'express'
import {
  getStudents,
  getStudentDetail,
  recordStudentPayment,
} from '../controllers/studentController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const studentRouter = express.Router()

// All student accounts endpoints require staff role ('accounts', 'admin', 'centre_admin')
studentRouter.use(requireAuth, requireRole('accounts'))

studentRouter.get('/', getStudents)
studentRouter.get('/:studentId', getStudentDetail)
studentRouter.post('/:studentId/payments', recordStudentPayment)
