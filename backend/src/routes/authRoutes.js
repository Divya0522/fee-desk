import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import { otpSendLimiter, authLoginLimiter } from '../middleware/rateLimit.js'
import { requireAuth } from '../middleware/auth.js'
import * as authController from '../controllers/authController.js'

const lookupSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit mobile number required'),
  studentId: z.string().min(1, 'Student ID required'),
})

const sendOtpSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit mobile number required'),
})

const verifyOtpSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit mobile number required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

const activateSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit mobile number required'),
  studentId: z.string().min(1, 'Student ID required'),
  guardianName: z.string().min(2, 'Parent/guardian name required'),
  relationship: z.string().min(1, 'Relationship is required'),
  language: z.enum(['en', 'hi']).default('en'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'DPDP Act 2023 parental consent is required' }),
  }),
  reminderOptIn: z.boolean().optional().default(false),
})

const staffLoginSchema = z.object({
  email: z.string().email('Valid work email required'),
  password: z.string().min(1, 'Password required'),
})

export const authRouter = Router()

authRouter.post('/lookup', validate({ body: lookupSchema }), authController.lookup)
authRouter.post('/otp/send', otpSendLimiter, validate({ body: sendOtpSchema }), authController.sendOtp)
authRouter.post('/otp/verify', authLoginLimiter, validate({ body: verifyOtpSchema }), authController.verifyOtp)
authRouter.post('/activate', validate({ body: activateSchema }), authController.activate)
authRouter.post('/staff/login', authLoginLimiter, validate({ body: staffLoginSchema }), authController.staffLogin)
authRouter.post('/logout', authController.logout)
authRouter.get('/me', requireAuth, authController.getMe)
authRouter.post('/change-password', requireAuth, authController.changePassword)
