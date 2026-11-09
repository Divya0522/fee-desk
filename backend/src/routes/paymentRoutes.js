import express from 'express'
import {
  getUnmatchedPayments,
  matchUnmatchedPayment,
  rejectUnmatchedPayment,
  handlePaymentWebhook,
  handleMockCheckout,
  handleBankCsvUpload,
} from '../controllers/paymentController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const paymentRouter = express.Router()

// Webhook endpoint: validates HMAC signature internally
paymentRouter.post('/webhook', handlePaymentWebhook)

// Mock checkout endpoint: token-authenticated for parents/links
paymentRouter.post('/mock-checkout/:token', handleMockCheckout)

// Staff accounts endpoints: require accounts role
paymentRouter.get('/unmatched', requireAuth, requireRole('accounts'), getUnmatchedPayments)
paymentRouter.post('/unmatched/:id/match', requireAuth, requireRole('accounts'), matchUnmatchedPayment)
paymentRouter.post('/unmatched/:id/reject', requireAuth, requireRole('accounts'), rejectUnmatchedPayment)
paymentRouter.post('/upload-bank-csv', requireAuth, requireRole('accounts'), handleBankCsvUpload)
