import rateLimit from 'express-rate-limit'
import { errorResponse } from '../utils/response.js'

/**
 * Global API rate limiter: 300 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later.', null, 429)
  },
})

/**
 * OTP send rate limiter: 5 requests per hour per phone/IP
 */
export const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const phone = req.body?.phone || ''
    return `${req.ip}_${phone}`
  },
  handler: (req, res) => {
    return errorResponse(
      res,
      'OTP_RATE_LIMIT_EXCEEDED',
      'Maximum OTP requests exceeded for this hour. Please wait before retrying.',
      null,
      429
    )
  },
})

/**
 * Authentication login rate limiter: 10 attempts per 15 minutes per IP
 */
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      'LOGIN_RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts. Please try again after 15 minutes.',
      null,
      429
    )
  },
})
