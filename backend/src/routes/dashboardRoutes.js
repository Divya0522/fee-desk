import express from 'express'
import {
  getDashboardSummary,
  getDashboardByCentre,
  getDashboardByBatch,
  getOverdueList,
  exportTallyCsv,
} from '../controllers/dashboardController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const dashboardRouter = express.Router()

// All dashboard endpoints require staff role ('accounts', 'admin', 'centre_admin')
dashboardRouter.use(requireAuth, requireRole('accounts'))

dashboardRouter.get('/summary', getDashboardSummary)
dashboardRouter.get('/by-centre', getDashboardByCentre)
dashboardRouter.get('/by-batch', getDashboardByBatch)
dashboardRouter.get('/overdue-list', getOverdueList)
dashboardRouter.get('/export/tally.csv', exportTallyCsv)
