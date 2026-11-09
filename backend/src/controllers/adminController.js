import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { Student } from '../models/Student.js'
import { UnmatchedPayment } from '../models/UnmatchedPayment.js'
import { RiskFlag } from '../models/RiskFlag.js'
import { ReminderLog } from '../models/ReminderLog.js'
import { AuditLog } from '../models/AuditLog.js'
import { JobRun } from '../models/JobRun.js'
import { REFUND_POLICY_CONFIG } from '../config/refundPolicy.js'
import { successResponse } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'
import { executeRemindersJob, executeRiskScoringJob } from '../services/jobService.js'

/**
 * Generate cryptographically secure random temporary password (14 chars)
 */
function generateTemporaryPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
  let pwd = 'FD-'
  const bytes = crypto.randomBytes(12)
  for (let i = 0; i < 11; i++) {
    pwd += chars[bytes[i] % chars.length]
  }
  return pwd
}

/**
 * GET /api/admin/overview
 * High-level counts, system health, job runtimes, recent audit items
 */
export async function getOverview(req, res, next) {
  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [
      studentsCount,
      activeParentsCount,
      totalStaffCount,
      activeStaffCount,
      openPaymentsCount,
      openRiskCount,
      remindersTodayCount,
      lastRemindersJob,
      lastRiskJob,
      recentAuditLogs,
    ] = await Promise.all([
      Student.countDocuments(),
      User.countDocuments({ role: 'parent', isActivated: true }),
      User.countDocuments({ role: { $in: ['accounts', 'admin'] } }),
      User.countDocuments({ role: { $in: ['accounts', 'admin'] }, isActive: { $ne: false } }),
      UnmatchedPayment.countDocuments({ status: 'open' }),
      RiskFlag.countDocuments({ status: 'open' }),
      ReminderLog.countDocuments({ sentAt: { $gte: startOfToday } }),
      JobRun.findOne({ name: 'reminders' }).sort({ createdAt: -1 }).lean(),
      JobRun.findOne({ name: 'risk_scoring' }).sort({ createdAt: -1 }).lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
    ])

    const dbState = mongoose.connection.readyState
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected'

    return successResponse(res, {
      counts: {
        students: studentsCount,
        activeParents: activeParentsCount,
        staff: totalStaffCount,
        activeStaff: activeStaffCount,
        openPaymentsQueue: openPaymentsCount,
        openCallTasks: openRiskCount,
        remindersSentToday: remindersTodayCount,
      },
      system: {
        dbStatus,
        dbHost: mongoose.connection.host || 'MongoDB Atlas',
        uptimeSec: Math.floor(process.uptime()),
        serverTime: new Date().toISOString(),
      },
      jobs: {
        reminders: lastRemindersJob || null,
        risk_scoring: lastRiskJob || null,
      },
      recentAuditLogs,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/admin/staff
 * Paginated staff list with search and filters
 */
export async function getStaff(req, res, next) {
  try {
    const { search, role, active, page = 1, limit = 20 } = req.query
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))

    const query = { role: { $in: ['accounts', 'admin'] } }

    if (role && role !== 'ALL') {
      query.role = role
    }

    if (active === 'true') {
      query.isActive = { $ne: false }
    } else if (active === 'false') {
      query.isActive = false
    }

    if (search && search.trim()) {
      const term = search.trim()
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { centre: { $regex: term, $options: 'i' } },
      ]
    }

    const [total, staff] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-passwordHash')
        .sort({ role: 1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ])

    return successResponse(res, staff, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/admin/staff
 * Creates an accounts staff member with a temporary password (returned once)
 */
export async function createStaff(req, res, next) {
  try {
    const { name, email, role, centre } = req.body
    const cleanEmail = email.trim().toLowerCase()

    // Guard: API can only create accounts staff (admins cannot create other admins)
    if (role !== 'accounts') {
      throw new AppError('Only accounts staff accounts can be created through the API.', 400, 'BAD_REQUEST')
    }

    const existing = await User.findOne({ email: cleanEmail })
    if (existing) {
      throw new AppError('An account with this email address already exists.', 409, 'CONFLICT')
    }

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 10)

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      role: 'accounts',
      centre: centre.trim(),
      passwordHash,
      isActive: true,
      isActivated: true,
      mustChangePassword: true,
    })

    // Write AuditLog
    await AuditLog.create({
      action: 'create_staff',
      entity: 'User',
      entityId: user._id.toString(),
      actor: req.user.email,
      performedBy: req.user.id,
      summary: `Created accounts staff account for ${user.name} (${user.email})`,
      details: { email: user.email, centre: user.centre, role: user.role },
      ipAddress: req.ip,
    })

    const userObj = user.toObject()
    delete userObj.passwordHash

    return successResponse(
      res,
      {
        user: userObj,
        temporaryPassword, // Shown only once!
      },
      undefined,
      201
    )
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/admin/staff/:id
 * Updates staff name, centre or active state with guard rails
 */
export async function updateStaff(req, res, next) {
  try {
    const { id } = req.params
    const { name, centre, isActive } = req.body

    const targetUser = await User.findById(id)
    if (!targetUser) {
      throw new AppError('Staff user not found.', 404, 'NOT_FOUND')
    }

    // Guard 1: Admin cannot deactivate or demote themselves
    if (req.user.id === targetUser._id.toString()) {
      if (isActive === false) {
        throw new AppError('You cannot deactivate your own administrator account.', 400, 'SELF_DEACTIVATION_FORBIDDEN')
      }
    }

    // Guard 2: The last active admin cannot be deactivated
    if (targetUser.role === 'admin' && isActive === false) {
      const activeAdminCount = await User.countDocuments({
        role: 'admin',
        isActive: { $ne: false },
      })
      if (activeAdminCount <= 1) {
        throw new AppError('Cannot deactivate the last active administrator.', 400, 'LAST_ADMIN_PROTECTED')
      }
    }

    const changes = {}
    if (name !== undefined) {
      targetUser.name = name.trim()
      changes.name = targetUser.name
    }
    if (centre !== undefined) {
      targetUser.centre = centre.trim()
      changes.centre = targetUser.centre
    }
    if (isActive !== undefined) {
      targetUser.isActive = Boolean(isActive)
      changes.isActive = targetUser.isActive
    }

    await targetUser.save()

    // Write AuditLog
    await AuditLog.create({
      action: isActive === false ? 'deactivate_staff' : isActive === true ? 'activate_staff' : 'update_staff',
      entity: 'User',
      entityId: targetUser._id.toString(),
      actor: req.user.email,
      performedBy: req.user.id,
      summary: `Updated staff profile for ${targetUser.name}: ${Object.keys(changes).join(', ')}`,
      details: { changes },
      ipAddress: req.ip,
    })

    const userObj = targetUser.toObject()
    delete userObj.passwordHash

    return successResponse(res, userObj)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/admin/staff/:id/reset-password
 * Resets password to a random temporary password (returned once)
 */
export async function resetStaffPassword(req, res, next) {
  try {
    const { id } = req.params
    const targetUser = await User.findById(id)
    if (!targetUser) {
      throw new AppError('Staff user not found.', 404, 'NOT_FOUND')
    }

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await bcrypt.hash(temporaryPassword, 10)

    targetUser.passwordHash = passwordHash
    targetUser.mustChangePassword = true
    targetUser.failedAttempts = 0
    targetUser.lockedUntil = null
    await targetUser.save()

    // Write AuditLog
    await AuditLog.create({
      action: 'reset_password',
      entity: 'User',
      entityId: targetUser._id.toString(),
      actor: req.user.email,
      performedBy: req.user.id,
      summary: `Reset password for staff member ${targetUser.name} (${targetUser.email})`,
      details: { email: targetUser.email },
      ipAddress: req.ip,
    })

    return successResponse(res, {
      message: 'Temporary password generated successfully.',
      temporaryPassword, // Shown only once!
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/admin/audit-logs
 * Paginated audit trail with filters
 */
export async function getAuditLogs(req, res, next) {
  try {
    const { actor, action, entity, from, to, page = 1, limit = 20 } = req.query
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))

    const query = {}

    if (actor && actor.trim()) {
      const term = actor.trim()
      query.$or = [{ actor: { $regex: term, $options: 'i' } }, { performedBy: { $regex: term, $options: 'i' } }]
    }

    if (action && action.trim() && action !== 'ALL') {
      query.action = action.trim()
    }

    if (entity && entity.trim() && entity !== 'ALL') {
      query.entity = entity.trim()
    }

    if (from || to) {
      query.createdAt = {}
      if (from) query.createdAt.$gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        query.createdAt.$lte = toDate
      }
    }

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ])

    return successResponse(res, logs, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/admin/jobs
 * List of background jobs with schedule, last run info and status
 */
export async function getJobs(req, res, next) {
  try {
    const [lastReminders, lastRisk] = await Promise.all([
      JobRun.findOne({ name: 'reminders' }).sort({ createdAt: -1 }).lean(),
      JobRun.findOne({ name: 'risk_scoring' }).sort({ createdAt: -1 }).lean(),
    ])

    const jobs = [
      {
        name: 'reminders',
        title: 'Reminders & Fee Automation',
        description: 'Evaluates instalments due soon or overdue and dispatches scheduled SMS/WhatsApp notices.',
        schedule: 'Daily at 08:00 IST (Offsets: -7d, -3d, 0, +3d, +7d, +15d)',
        note: 'Reminders stop the moment a payment is recorded.',
        lastRun: lastReminders || null,
      },
      {
        name: 'risk_scoring',
        title: 'Dropout Risk Scoring Engine',
        description: 'Analyzes student attendance dips, test score degradation, and overdue instalments.',
        schedule: 'Nightly at 02:00 IST',
        note: 'Risk flags only create call tasks; they never message parents or change fees.',
        lastRun: lastRisk || null,
      },
    ]

    return successResponse(res, jobs)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/admin/jobs/:name/run
 * Manually triggers a background job execution
 */
export async function runJob(req, res, next) {
  try {
    const { name } = req.params
    const triggeredBy = req.user?.email || 'admin'

    if (name === 'reminders') {
      const result = await executeRemindersJob(triggeredBy)
      return successResponse(res, result)
    }

    if (name === 'risk_scoring') {
      const result = await executeRiskScoringJob(triggeredBy)
      return successResponse(res, result)
    }

    throw new AppError(`Unknown job name: ${name}. Must be 'reminders' or 'risk_scoring'.`, 400, 'BAD_REQUEST')
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/admin/settings
 * Read-only parameters: refund policy, GST, offsets, scoring rules, OTP limits
 */
export async function getSettings(req, res, next) {
  try {
    const settings = {
      notice: 'These values are set in code and are not editable here.',
      refundPolicy: {
        version: REFUND_POLICY_CONFIG.policyVersion,
        effectiveFrom: REFUND_POLICY_CONFIG.effectiveFrom,
        deductionRatePercent: REFUND_POLICY_CONFIG.deductionRatePercent,
        deductionCapPaise: REFUND_POLICY_CONFIG.deductionCapPaise,
        payoutLimitDays: REFUND_POLICY_CONFIG.payoutLimitDays,
        proRataBasis: REFUND_POLICY_CONFIG.proRataBasis,
        rules: [
          'Registration Fee Retention: 5% of tuition fee (capped at ₹5,000) is deducted towards administrative kit & LMS setup.',
          'Pro-Rata Tuition Deduction: Deducted strictly by elapsed academic calendar days.',
          'GST Reversal Note: Reversal credit note issued under Section 34 of the CGST Act 2017.',
          'Statutory Payout SLA: All verified refunds must be credited within 10 calendar days.',
        ],
      },
      taxation: {
        gstRatePercent: 18,
        inclusiveInQuotedFees: true,
      },
      reminders: {
        channels: ['sms', 'whatsapp'],
        offsets: ['-7 days (upcoming)', '-3 days (urgent)', '0 (due date)', '+3 days (grace period)', '+7 days (overdue)', '+15 days (critical)'],
        autoHaltOnPayment: true,
      },
      riskScoring: {
        scoreRange: '0 to 100',
        factors: [
          { rule: 'Attendance drop below 60%', points: 30 },
          { rule: 'Attendance drop between 60% and 75%', points: 15 },
          { rule: 'Instalment overdue past 15+ days', points: 25 },
          { rule: 'Phase test score dip below 40% or drop of 20+ points', points: 25 },
        ],
        actionPolicy: 'Only counsellor call tasks are triggered. Never alters fees or sends messages.',
      },
      authentication: {
        otpExpiryMinutes: 5,
        maxOtpVerificationAttempts: 5,
        accountLockoutMinutes: 5,
        passwordMinLength: 8,
      },
    }

    return successResponse(res, settings)
  } catch (err) {
    next(err)
  }
}
