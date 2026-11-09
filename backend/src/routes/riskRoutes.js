import express from 'express'
import {
  getRiskFlags,
  markRiskFlagContacted,
  markRiskFlagFalse,
  resolveRiskFlag,
} from '../controllers/riskController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const riskRouter = express.Router()

// All risk flag endpoints require staff role ('accounts', 'admin', 'centre_admin')
riskRouter.use(requireAuth, requireRole('accounts'))

riskRouter.get('/', getRiskFlags)
riskRouter.post('/:id/contacted', markRiskFlagContacted)
riskRouter.post('/:id/false-flag', markRiskFlagFalse)
riskRouter.post('/:id/resolve', resolveRiskFlag)
