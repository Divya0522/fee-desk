import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { Student } from '../models/Student.js'
import { OtpRequest } from '../models/OtpRequest.js'
import { Consent } from '../models/Consent.js'
import { AuditLog } from '../models/AuditLog.js'
import { env } from '../config/env.js'
import { signToken, setAuthCookie, clearAuthCookie } from '../services/tokenService.js'
import { successResponse } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'

/**
 * POST /api/auth/lookup
 * Checks if the student ID and registered phone match
 */
export async function lookup(req, res, next) {
  try {
    const { phone, studentId } = req.body
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10)
    const upperId = String(studentId).trim().toUpperCase()

    const student = await Student.findOne({
      studentId: upperId,
      guardianPhone: cleanPhone,
    }).lean()

    if (!student) {
      throw new AppError(
        'Could not find any student matching this ID and registered mobile number.',
        404,
        'STUDENT_NOT_FOUND'
      )
    }

    return successResponse(res, {
      studentId: student.studentId,
      name: student.name,
      batch: student.batch,
      centre: student.centre,
      course: student.course,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/otp/send
 * Issues 6-digit OTP to registered phone with rate limiting & lock check
 */
export async function sendOtp(req, res, next) {
  try {
    const { phone } = req.body
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10)

    // Verify phone is registered in Student roster or existing User
    const [studentExists, user] = await Promise.all([
      Student.exists({ guardianPhone: cleanPhone }),
      User.findOne({ phone: cleanPhone }),
    ])

    if (!studentExists && !user) {
      throw new AppError(
        'This mobile number is not registered with the coaching institute.',
        404,
        'NOT_FOUND'
      )
    }

    // Check if account is currently locked out
    if (user?.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingSec = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000)
      throw new AppError(
        `Account temporarily locked due to too many attempts. Please try again in ${remainingSec} seconds.`,
        423,
        'ACCOUNT_LOCKED',
        { retryAfterSec: remainingSec }
      )
    }

    // Generate 6-digit OTP
    const otp = env.NODE_ENV !== 'production' ? env.DEMO_OTP : Math.floor(100000 + Math.random() * 900000).toString()
    const otpHash = await bcrypt.hash(otp, 10)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Invalidate existing unused OTP requests for this phone
    await OtpRequest.deleteMany({ phone: cleanPhone })

    // Store new OTP request
    await OtpRequest.create({
      phone: cleanPhone,
      otpHash,
      expiresAt,
      attempts: 0,
      consumed: false,
    })

    // Masked logging in non-production only
    if (env.NODE_ENV !== 'production') {
      const maskedPhone = cleanPhone.slice(0, 2) + 'xxxxxx' + cleanPhone.slice(-2)
      console.log(`[SMS Gateway] Dispatched OTP to +91-${maskedPhone} (expires in 5m)`)
    }

    return successResponse(res, {
      message: 'OTP sent successfully to your registered mobile number.',
      expiresInSec: 300,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/otp/verify
 * Verifies OTP, handles 5-failure lockout, and sets JWT cookie
 */
export async function verifyOtp(req, res, next) {
  try {
    const { phone, otp } = req.body
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10)
    const cleanOtp = String(otp).trim()

    let user = await User.findOne({ phone: cleanPhone })

    // Check account lockout
    if (user?.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingSec = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000)
      throw new AppError(
        `Account is locked. Please wait ${remainingSec} seconds.`,
        423,
        'ACCOUNT_LOCKED',
        { retryAfterSec: remainingSec }
      )
    }

    const otpRecord = await OtpRequest.findOne({
      phone: cleanPhone,
      consumed: false,
    }).sort({ createdAt: -1 })

    if (!otpRecord || new Date(otpRecord.expiresAt) < new Date()) {
      throw new AppError('OTP has expired or is invalid. Please request a new one.', 400, 'OTP_EXPIRED')
    }

    // Check OTP match (allow DEMO_OTP in non-production)
    const isDemoMatch = env.NODE_ENV !== 'production' && cleanOtp === env.DEMO_OTP
    const isHashMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash)

    if (!isDemoMatch && !isHashMatch) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1
      await otpRecord.save()

      const failedCount = (user?.failedAttempts || 0) + 1
      let lockedUntil = null

      if (failedCount >= 5) {
        lockedUntil = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      }

      if (user) {
        user.failedAttempts = failedCount
        user.lockedUntil = lockedUntil
        await user.save()
      }

      if (failedCount >= 5) {
        throw new AppError(
          'Too many failed OTP attempts. Account locked for 5 minutes.',
          423,
          'ACCOUNT_LOCKED',
          { retryAfterSec: 300 }
        )
      }

      throw new AppError('Incorrect 6-digit OTP entered. Please try again.', 400, 'INVALID_OTP')
    }

    // OTP verified successfully
    otpRecord.consumed = true
    await otpRecord.save()

    // Find all students registered under this phone
    const studentRecords = await Student.find({ guardianPhone: cleanPhone }).lean()
    const studentIds = studentRecords.map((s) => s.studentId)

    if (!user) {
      // First-time parent creation
      user = await User.create({
        role: 'parent',
        name: studentRecords[0]?.name ? `${studentRecords[0].name}'s Parent` : 'Parent',
        phone: cleanPhone,
        studentIds,
        isActivated: false,
        failedAttempts: 0,
        lockedUntil: null,
      })
    } else {
      user.failedAttempts = 0
      user.lockedUntil = null
      if (studentIds.length > 0) {
        user.studentIds = Array.from(new Set([...(user.studentIds || []), ...studentIds]))
      }
      await user.save()
    }

    // If parent is not yet activated, return activation status
    if (!user.isActivated) {
      const activationToken = signToken({ id: user._id, role: user.role, purpose: 'activation' }, '15m')
      return successResponse(res, {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          isActivated: false,
          studentIds: user.studentIds,
        },
        activationToken,
        isActivated: false,
      })
    }

    // Issue auth token & set cookie
    const token = signToken({ id: user._id, role: user.role })
    setAuthCookie(res, token)

    return successResponse(res, {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActivated: true,
        studentIds: user.studentIds,
        language: user.language,
      },
      token,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/activate
 * Registers DPDP Act 2023 parental consent and marks parent account activated
 */
export async function activate(req, res, next) {
  try {
    const { phone, studentId, guardianName, relationship, language, consent, reminderOptIn } = req.body

    // Explicit consent is mandatory under DPDP Act 2023
    if (!consent) {
      throw new AppError(
        'Verifiable parental consent under the DPDP Act 2023 is required to activate an account.',
        400,
        'CONSENT_REQUIRED'
      )
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10)
    const upperId = String(studentId).trim().toUpperCase()

    // Verify student exists and belongs to this phone
    const student = await Student.findOne({
      studentId: upperId,
      guardianPhone: cleanPhone,
    })

    if (!student) {
      throw new AppError('Student record matching this phone was not found.', 404, 'STUDENT_NOT_FOUND')
    }

    // Find or create User
    let user = await User.findOne({ phone: cleanPhone })
    if (!user) {
      user = new User({
        role: 'parent',
        phone: cleanPhone,
        studentIds: [upperId],
      })
    }

    user.name = guardianName.trim()
    user.isActivated = true
    user.language = language === 'hi' ? 'hi' : 'en'
    if (!user.studentIds.includes(upperId)) {
      user.studentIds.push(upperId)
    }
    user.failedAttempts = 0
    user.lockedUntil = null
    await user.save()

    // Record Consent
    await Consent.create({
      userId: user._id,
      studentId: upperId,
      guardianName: guardianName.trim(),
      relationship: relationship.trim(),
      policyVersion: 'v1.0',
      language: user.language,
      reminderOptIn: Boolean(reminderOptIn),
    })

    // Write AuditLog
    await AuditLog.create({
      action: 'parent_activation_consent',
      entity: 'Consent',
      entityId: upperId,
      performedBy: user._id.toString(),
      details: {
        guardianName,
        relationship,
        reminderOptIn,
        ipAddress: req.ip,
      },
    })

    // Set authenticated session cookie
    const token = signToken({ id: user._id, role: user.role })
    setAuthCookie(res, token)

    return successResponse(res, {
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isActivated: true,
        studentIds: user.studentIds,
        language: user.language,
      },
      token,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/staff/login
 * Staff / Accounts executive email + password login with 5-failure lockout
 */
export async function staffLogin(req, res, next) {
  try {
    const { email, password } = req.body
    const cleanEmail = String(email).trim().toLowerCase()

    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash')

    // Generic error to avoid account enumeration
    const invalidCredsError = new AppError(
      'Email or password is incorrect.',
      400,
      'INVALID_CREDENTIALS'
    )

    if (!user || !user.passwordHash || user.isActive === false) {
      throw invalidCredsError
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const remainingSec = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000)
      throw new AppError(
        `Account is locked due to too many failed attempts. Try again in ${remainingSec} seconds.`,
        423,
        'ACCOUNT_LOCKED',
        { retryAfterSec: remainingSec }
      )
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash)
    if (!isMatch) {
      user.failedAttempts = (user.failedAttempts || 0) + 1
      if (user.failedAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      }
      await user.save()

      if (user.failedAttempts >= 5) {
        throw new AppError(
          'Too many failed attempts. Account locked for 5 minutes.',
          423,
          'ACCOUNT_LOCKED',
          { retryAfterSec: 300 }
        )
      }

      throw invalidCredsError
    }

    // Reset failed attempts & record last login
    user.failedAttempts = 0
    user.lockedUntil = null
    user.lastLoginAt = new Date()
    await user.save()

    const token = signToken({ id: user._id, role: user.role })
    setAuthCookie(res, token)

    return successResponse(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        centre: user.centre,
        mustChangePassword: Boolean(user.mustChangePassword),
      },
      token,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/change-password
 * Forces password change on first login or user request
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required.', 400, 'BAD_REQUEST')
    }

    // Password strength rules: min 8 chars, letter + number/special
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long.', 400, 'WEAK_PASSWORD')
    }
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      throw new AppError('New password must contain at least one letter and one number or symbol.', 400, 'WEAK_PASSWORD')
    }

    if (currentPassword === newPassword) {
      throw new AppError('New password cannot be identical to current password.', 400, 'SAME_PASSWORD')
    }

    const user = await User.findById(req.user.id).select('+passwordHash')
    if (!user || !user.passwordHash) {
      throw new AppError('User not found or has no password set.', 404, 'NOT_FOUND')
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.passwordHash)
    if (!isMatch) {
      throw new AppError('Current password does not match.', 400, 'INVALID_CREDENTIALS')
    }

    const newHash = await bcrypt.hash(String(newPassword), 10)
    user.passwordHash = newHash
    user.mustChangePassword = false
    await user.save()

    // Write audit log
    await AuditLog.create({
      action: 'change_password',
      entity: 'User',
      entityId: user._id.toString(),
      actor: user.email || user.phone || 'user',
      performedBy: user._id.toString(),
      summary: `User ${user.email || user.name} changed their password`,
      details: { ipAddress: req.ip },
    })

    return successResponse(res, { message: 'Password changed successfully.' })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/logout
 * Invalidate session and clear auth cookie
 */
export async function logout(req, res) {
  clearAuthCookie(res)
  return successResponse(res, { message: 'Successfully logged out.' })
}

/**
 * GET /api/auth/me
 * Returns authenticated user profile
 */
export async function getMe(req, res) {
  return successResponse(res, { user: req.user })
}
