import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import * as adminController from '../controllers/adminController.js'

export const adminRouter = Router()

// All admin routes require authentication and role "admin"
adminRouter.use(requireAuth, requireRole('admin'))

// 1. Overview
adminRouter.get('/overview', adminController.getOverview)

// 2. Staff Management
const createStaffSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid work email required'),
    role: z.literal('accounts', {
      errorMap: () => ({ message: 'API can only create accounts staff' }),
    }),
    centre: z.string().min(1, 'Centre is required'),
  })
  .strict()

const updateStaffSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    centre: z.string().min(1, 'Centre cannot be empty').optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

adminRouter.get('/staff', adminController.getStaff)
adminRouter.post('/staff', validate({ body: createStaffSchema }), adminController.createStaff)
adminRouter.patch('/staff/:id', validate({ body: updateStaffSchema }), adminController.updateStaff)
adminRouter.post('/staff/:id/reset-password', adminController.resetStaffPassword)

// 3. Audit Trail
adminRouter.get('/audit-logs', adminController.getAuditLogs)

// 4. Background Jobs
adminRouter.get('/jobs', adminController.getJobs)
adminRouter.post('/jobs/:name/run', adminController.runJob)

// 5. System Settings (Read-only)
adminRouter.get('/settings', adminController.getSettings)
