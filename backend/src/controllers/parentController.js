import crypto from 'crypto'
import { Student } from '../models/Student.js'
import { FeePlan } from '../models/FeePlan.js'
import { Instalment } from '../models/Instalment.js'
import { Receipt } from '../models/Receipt.js'
import { Attendance } from '../models/Attendance.js'
import { TestScore } from '../models/TestScore.js'
import { ReminderLog } from '../models/ReminderLog.js'
import { successResponse } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getParentStudents(req, res, next) {
  try {
    const studentIds = req.user.studentIds || []
    if (studentIds.length === 0) {
      return successResponse(res, [])
    }

    const students = await Student.find({ studentId: { $in: studentIds } }).lean()
    const instalments = await Instalment.find({ studentId: { $in: studentIds } }).lean()

    const now = new Date()
    const enriched = students.map((s) => {
      const studentInsts = instalments.filter((i) => i.studentId === s.studentId)
      let balancePaise = 0
      let overduePaise = 0

      for (const inst of studentInsts) {
        const bal = Math.max(0, inst.amountPaise - (inst.paidPaise || 0))
        balancePaise += bal
        if (bal > 0 && new Date(inst.dueDate) < now) {
          overduePaise += bal
        }
      }

      return {
        ...s,
        balancePaise,
        overduePaise,
      }
    })

    return successResponse(res, enriched)
  } catch (err) {
    next(err)
  }
}

export async function getParentStudentLedger(req, res, next) {
  try {
    const { studentId } = req.params
    const cleanId = studentId.trim().toUpperCase()

    const student = await Student.findOne({ studentId: cleanId }).lean()
    if (!student) {
      throw new AppError('Student record not found.', 404, 'NOT_FOUND')
    }

    const [plan, instalments] = await Promise.all([
      FeePlan.findOne({ studentId: cleanId }).lean(),
      Instalment.find({ studentId: cleanId }).sort({ sequence: 1 }).lean(),
    ])

    const now = new Date()
    const enrichedInstalments = (instalments || []).map((inst) => {
      const balancePaise = Math.max(0, inst.amountPaise - (inst.paidPaise || 0))
      let status = 'upcoming'
      let daysOverdue = 0

      if (balancePaise === 0 && inst.paidPaise > 0) {
        status = 'paid'
      } else if (inst.paidPaise > 0) {
        status = 'partial'
      }

      if (balancePaise > 0 && new Date(inst.dueDate) < now) {
        status = 'overdue'
        const diffMs = now.getTime() - new Date(inst.dueDate).getTime()
        daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      }

      return {
        _id: inst._id,
        sequence: inst.sequence,
        dueDate: inst.dueDate,
        amountPaise: inst.amountPaise,
        paidPaise: inst.paidPaise || 0,
        balancePaise,
        status,
        daysOverdue,
        paymentLinkToken: inst.paymentLinkToken || null,
      }
    })

    const totalFee = plan?.totalFeePaise || plan?.totalPaise || enrichedInstalments.reduce((a, b) => a + b.amountPaise, 0)
    const discount = plan?.discountPaise || 0
    const netPayable = Math.max(0, totalFee - discount)
    const totalPaid = enrichedInstalments.reduce((a, b) => a + b.paidPaise, 0)
    const balancePaise = Math.max(0, netPayable - totalPaid)

    return successResponse(res, {
      student,
      plan: {
        totalPaise: totalFee,
        discountPaise: discount,
        netPayablePaise: netPayable,
        paidPaise: totalPaid,
        balancePaise,
      },
      instalments: enrichedInstalments,
    })
  } catch (err) {
    next(err)
  }
}

export async function getParentStudentReceipts(req, res, next) {
  try {
    const { studentId } = req.params
    const cleanId = studentId.trim().toUpperCase()

    const receipts = await Receipt.find({ studentId: cleanId }).sort({ issuedAt: -1 }).lean()
    return successResponse(res, receipts)
  } catch (err) {
    next(err)
  }
}

export async function getParentStudentAttendance(req, res, next) {
  try {
    const { studentId } = req.params
    const cleanId = studentId.trim().toUpperCase()

    const records = await Attendance.find({ studentId: cleanId }).sort({ date: -1 }).limit(60).lean()
    return successResponse(res, records)
  } catch (err) {
    next(err)
  }
}

export async function getParentStudentScores(req, res, next) {
  try {
    const { studentId } = req.params
    const cleanId = studentId.trim().toUpperCase()

    const scores = await TestScore.find({ studentId: cleanId }).sort({ testDate: -1 }).lean()
    return successResponse(res, scores)
  } catch (err) {
    next(err)
  }
}

export async function getParentStudentReminders(req, res, next) {
  try {
    const { studentId } = req.params
    const cleanId = studentId.trim().toUpperCase()

    const instalments = await Instalment.find({ studentId: cleanId }).select('_id sequence dueDate amountPaise paidPaise').lean()
    const instalmentIds = instalments.map((i) => i._id)

    const reminders = await ReminderLog.find({ instalmentId: { $in: instalmentIds } })
      .sort({ createdAt: -1, scheduledFor: -1 })
      .lean()

    const instalmentMap = new Map(instalments.map((i) => [i._id.toString(), i]))

    const enriched = reminders.map((r) => {
      const inst = instalmentMap.get(r.instalmentId.toString())
      return {
        ...r,
        sequence: inst?.sequence || 1,
        dueDate: inst?.dueDate,
        amountPaise: inst?.amountPaise || 0,
        paidPaise: inst?.paidPaise || 0,
      }
    })

    return successResponse(res, enriched)
  } catch (err) {
    next(err)
  }
}

export async function createInstalmentPayLink(req, res, next) {
  try {
    const { id } = req.params
    const instalment = await Instalment.findById(id)
    if (!instalment) {
      throw new AppError('Instalment not found', 404, 'NOT_FOUND')
    }

    // Access check: parent must have this student
    if (req.user.role === 'parent' && !req.user.studentIds.includes(instalment.studentId)) {
      throw new AppError('Access denied', 403, 'FORBIDDEN')
    }

    if (!instalment.paymentLinkToken) {
      instalment.paymentLinkToken = crypto.randomBytes(16).toString('hex')
      await instalment.save()
    }

    return successResponse(res, {
      token: instalment.paymentLinkToken,
      url: `/pay/${instalment.paymentLinkToken}`,
      instalmentId: instalment._id,
      amountPaise: Math.max(0, instalment.amountPaise - (instalment.paidPaise || 0)),
    })
  } catch (err) {
    next(err)
  }
}
