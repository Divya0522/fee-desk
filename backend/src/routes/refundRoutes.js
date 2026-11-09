import express from 'express'
import {
  calculateRefundPreview,
  createRefundRequest,
  getRefundsList,
  approveRefund,
  rejectRefund,
  markRefundPaid,
} from '../controllers/refundController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const refundRouter = express.Router()

// All refund endpoints require staff role ('accounts', 'admin', 'centre_admin')
refundRouter.use(requireAuth, requireRole('accounts'))

refundRouter.post('/calculate', calculateRefundPreview)
refundRouter.post('/', createRefundRequest)
refundRouter.get('/', getRefundsList)
refundRouter.post('/:id/approve', approveRefund)
refundRouter.post('/:id/reject', rejectRefund)
refundRouter.post('/:id/mark-paid', markRefundPaid)
