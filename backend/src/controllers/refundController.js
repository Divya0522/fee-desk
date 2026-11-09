import { Student } from '../models/Student.js'
import { FeePlan } from '../models/FeePlan.js'
import { Instalment } from '../models/Instalment.js'
import { Payment } from '../models/Payment.js'
import { RefundRequest } from '../models/RefundRequest.js'
import { successResponse } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'
import {
  REFUND_POLICY_CONFIG,
  executeRefundCalculation,
  getPublishedPolicySummary,
} from '../config/refundPolicy.js'

export function computeRefundBreakdown({ student, plan, instalments, payments, leaveDate }) {
  // Total paid by student across successful payments or recorded instalment receipts
  const paymentsTotal = (payments || [])
    .filter((p) => p.status === 'success')
    .reduce((acc, p) => acc + p.amountPaise, 0)

  const instalmentsTotal = (instalments || []).reduce((acc, i) => acc + (i.paidPaise || 0), 0)

  // Use payments collection total, or fallback to instalments paidPaise
  const totalPaidPaise = Math.max(paymentsTotal, instalmentsTotal)

  // Fee after scholarship / discount
  let feeAfterDiscountPaise =
    (plan?.totalFeePaise ? plan.totalFeePaise - (plan.discountPaise || 0) : null) ||
    plan?.netPayablePaise
  if (!feeAfterDiscountPaise) {
    feeAfterDiscountPaise = (instalments || []).reduce((acc, i) => acc + i.amountPaise, 0)
  }
  if (!feeAfterDiscountPaise || feeAfterDiscountPaise <= 0) {
    feeAfterDiscountPaise = 12000000
  }

  const calc = executeRefundCalculation({
    feeAfterDiscountPaise,
    paidPaise: totalPaidPaise,
    courseStart: student.courseStart,
    courseEnd: student.courseEnd,
    leaveDate,
  })

  return {
    studentId: student.studentId,
    // Top-level aliases for frontend compatibility
    refundAmountPaise: calc.refundPaise,
    finalRefundPaise: calc.refundPaise,
    totalFeePaise: feeAfterDiscountPaise,
    netTuitionFeePaise: feeAfterDiscountPaise,
    amountPaidPaise: totalPaidPaise,
    deductionPaise: calc.breakdown.deductionPaise,
    consumedTuitionPaise: calc.breakdown.consumedPaise,
    daysElapsed: calc.breakdown.daysElapsed,
    totalSessionDays: calc.breakdown.totalCourseDays,
    retainedGstPaise: calc.breakdown.gstOnRetainedPaise,
    ...calc,
  }
}

export async function getRefundPolicy(req, res, next) {
  try {
    const policy = getPublishedPolicySummary()
    return successResponse(res, policy)
  } catch (err) {
    next(err)
  }
}

export async function calculateRefundPreview(req, res, next) {
  try {
    const { studentId, leaveDate } = req.body
    if (!studentId || !leaveDate) {
      throw new AppError('studentId and leaveDate are required', 400, 'BAD_REQUEST')
    }

    const cleanId = studentId.trim().toUpperCase()
    const student = await Student.findOne({ studentId: cleanId }).lean()
    if (!student) {
      throw new AppError(`Student ${cleanId} not found`, 404, 'NOT_FOUND')
    }

    const [plan, instalments, payments] = await Promise.all([
      FeePlan.findOne({ studentId: cleanId }).lean(),
      Instalment.find({ studentId: cleanId }).lean(),
      Payment.find({ studentId: cleanId }).lean(),
    ])

    const calculation = computeRefundBreakdown({
      student,
      plan,
      instalments,
      payments,
      leaveDate,
    })

    return successResponse(res, calculation)
  } catch (err) {
    next(err)
  }
}

export async function createRefundRequest(req, res, next) {
  try {
    const { studentId, leaveDate } = req.body
    if (!studentId || !leaveDate) {
      throw new AppError('studentId and leaveDate are required', 400, 'BAD_REQUEST')
    }

    const cleanId = studentId.trim().toUpperCase()
    const student = await Student.findOne({ studentId: cleanId })
    if (!student) {
      throw new AppError(`Student ${cleanId} not found`, 404, 'NOT_FOUND')
    }

    const [plan, instalments, payments] = await Promise.all([
      FeePlan.findOne({ studentId: cleanId }).lean(),
      Instalment.find({ studentId: cleanId }).lean(),
      Payment.find({ studentId: cleanId }).lean(),
    ])

    const calculation = computeRefundBreakdown({
      student,
      plan,
      instalments,
      payments,
      leaveDate,
    })

    const refund = await RefundRequest.create({
      studentId: cleanId,
      leaveDate: new Date(leaveDate),
      breakdown: calculation.breakdown,
      refundPaise: calculation.refundPaise,
      payoutDueBy: calculation.payoutDueBy,
      status: 'calculated',
      policyVersion: 'v1.0',
      decidedBy: req.user?.id || null,
    })

    // Update student status to 'left'
    student.status = 'left'
    student.leftOn = new Date(leaveDate)
    await student.save()

    return successResponse(res, refund, undefined, 201)
  } catch (err) {
    next(err)
  }
}

export async function getRefundsList(req, res, next) {
  try {
    const { status, centre } = req.query

    const query = {}
    if (status && status !== 'ALL') {
      query.status = status
    }

    const refunds = await RefundRequest.find(query).sort({ createdAt: -1 }).lean()
    const studentIds = [...new Set(refunds.map((r) => r.studentId))]
    const students = await Student.find({ studentId: { $in: studentIds } }).lean()
    const studentMap = new Map(students.map((s) => [s.studentId, s]))

    let enriched = refunds.map((r) => {
      const student = studentMap.get(r.studentId)
      return {
        ...r,
        studentName: student?.name || r.studentId,
        centre: student?.centre || '—',
        refundAmountPaise: r.refundPaise,
      }
    })

    if (centre && centre !== 'ALL') {
      enriched = enriched.filter((r) => r.centre === centre)
    }

    return successResponse(res, enriched)
  } catch (err) {
    next(err)
  }
}

export async function approveRefund(req, res, next) {
  try {
    const { id } = req.params
    const refund = await RefundRequest.findById(id)
    if (!refund) {
      throw new AppError('Refund request not found', 404, 'NOT_FOUND')
    }

    refund.status = 'approved'
    refund.decidedBy = req.user?.id || null
    await refund.save()

    return successResponse(res, refund)
  } catch (err) {
    next(err)
  }
}

export async function rejectRefund(req, res, next) {
  try {
    const { id } = req.params
    const { note } = req.body

    const refund = await RefundRequest.findById(id)
    if (!refund) {
      throw new AppError('Refund request not found', 404, 'NOT_FOUND')
    }

    refund.status = 'rejected'
    refund.decidedBy = req.user?.id || null
    if (note) {
      refund.breakdown = { ...refund.breakdown, rejectionNote: note }
    }
    await refund.save()

    return successResponse(res, refund)
  } catch (err) {
    next(err)
  }
}

export async function markRefundPaid(req, res, next) {
  try {
    const { id } = req.params
    const refund = await RefundRequest.findById(id)
    if (!refund) {
      throw new AppError('Refund request not found', 404, 'NOT_FOUND')
    }

    refund.status = 'paid'
    refund.decidedBy = req.user?.id || null
    await refund.save()

    return successResponse(res, refund)
  } catch (err) {
    next(err)
  }
}
