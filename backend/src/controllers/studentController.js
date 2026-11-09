import { Student } from '../models/Student.js'
import { FeePlan } from '../models/FeePlan.js'
import { Instalment } from '../models/Instalment.js'
import { Payment } from '../models/Payment.js'
import { Receipt } from '../models/Receipt.js'
import { RiskFlag } from '../models/RiskFlag.js'
import { ReminderLog } from '../models/ReminderLog.js'
import { RefundRequest } from '../models/RefundRequest.js'
import { successResponse } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getStudents(req, res, next) {
  try {
    const { search, centre, batch, status, overdueOnly, page = 1, limit = 15 } = req.query

    const query = {}
    if (centre && centre !== 'ALL') query.centre = centre
    if (batch && batch !== 'ALL') query.batch = batch
    if (status && status !== 'ALL') query.status = status

    if (search && search.trim()) {
      const term = search.trim()
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { studentId: { $regex: term, $options: 'i' } },
      ]
    }

    const allMatchingStudents = await Student.find(query).lean()
    const studentIds = allMatchingStudents.map((s) => s.studentId)

    // Fetch all instalments for matching students
    const instalments = await Instalment.find({ studentId: { $in: studentIds } }).lean()
    const studentInstMap = new Map()
    for (const inst of instalments) {
      if (!studentInstMap.has(inst.studentId)) {
        studentInstMap.set(inst.studentId, [])
      }
      studentInstMap.get(inst.studentId).push(inst)
    }

    // Fetch active risk flags
    const riskFlags = await RiskFlag.find({ studentId: { $in: studentIds }, status: 'open' }).lean()
    const riskMap = new Map(riskFlags.map((rf) => [rf.studentId, rf.level]))

    const now = new Date()
    let enrichedStudents = allMatchingStudents.map((s) => {
      const insts = studentInstMap.get(s.studentId) || []
      let totalBalance = 0
      let maxDaysOverdue = 0

      for (const inst of insts) {
        const bal = Math.max(0, inst.amountPaise - (inst.paidPaise || 0))
        totalBalance += bal

        if (bal > 0 && new Date(inst.dueDate) < now) {
          const diffMs = now.getTime() - new Date(inst.dueDate).getTime()
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
          if (days > maxDaysOverdue) {
            maxDaysOverdue = days
          }
        }
      }

      return {
        _id: s._id,
        studentId: s.studentId,
        name: s.name,
        centre: s.centre,
        batch: s.batch,
        course: s.course,
        status: s.status,
        guardianPhone: s.guardianPhone,
        balancePaise: totalBalance,
        daysOverdue: maxDaysOverdue,
        riskLevel: riskMap.get(s.studentId) || null,
        createdAt: s.createdAt,
      }
    })

    if (overdueOnly === 'true' || overdueOnly === true) {
      enrichedStudents = enrichedStudents.filter((s) => s.daysOverdue > 0)
    }

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 15
    const total = enrichedStudents.length
    const totalPages = Math.ceil(total / limitNum) || 1
    const paginated = enrichedStudents.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    return successResponse(res, {
      students: paginated,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    })
  } catch (err) {
    next(err)
  }
}

export async function getStudentDetail(req, res, next) {
  try {
    const { studentId } = req.params
    const cleanId = studentId.trim().toUpperCase()

    const student = await Student.findOne({ studentId: cleanId }).lean()
    if (!student) {
      throw new AppError(`Student ${cleanId} not found`, 404, 'NOT_FOUND')
    }

    const [plan, instalments, payments, receipts, riskFlag, reminders, refundRequest] =
      await Promise.all([
        FeePlan.findOne({ studentId: cleanId }).lean(),
        Instalment.find({ studentId: cleanId }).sort({ sequence: 1 }).lean(),
        Payment.find({ studentId: cleanId }).sort({ paidAt: -1 }).lean(),
        Receipt.find({ studentId: cleanId }).sort({ issuedAt: -1 }).lean(),
        RiskFlag.findOne({ studentId: cleanId }).sort({ createdAt: -1 }).lean(),
        ReminderLog.find({ instalmentId: { $in: (await Instalment.find({ studentId: cleanId })).map((i) => i._id) } })
          .sort({ scheduledFor: -1 })
          .lean(),
        RefundRequest.findOne({ studentId: cleanId }).sort({ createdAt: -1 }).lean(),
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
        ...inst,
        balancePaise,
        status,
        daysOverdue,
      }
    })

    let feePlanData = plan
    if (!feePlanData) {
      const totalAmount = enrichedInstalments.reduce((acc, i) => acc + i.amountPaise, 0)
      const totalPaid = enrichedInstalments.reduce((acc, i) => acc + (i.paidPaise || 0), 0)
      feePlanData = {
        totalPaise: totalAmount,
        discountPaise: 0,
        netPayablePaise: totalAmount,
        paidPaise: totalPaid,
        balancePaise: Math.max(0, totalAmount - totalPaid),
      }
    } else {
      const totalFee = feePlanData.totalFeePaise || feePlanData.totalPaise || 0
      const discount = feePlanData.discountPaise || 0
      const netPayable = Math.max(0, totalFee - discount)
      const totalPaid = enrichedInstalments.reduce((acc, i) => acc + (i.paidPaise || 0), 0)
      feePlanData = {
        ...feePlanData,
        totalPaise: totalFee,
        discountPaise: discount,
        netPayablePaise: netPayable,
        paidPaise: totalPaid,
        balancePaise: Math.max(0, netPayable - totalPaid),
      }
    }

    return successResponse(res, {
      ...student,
      plan: feePlanData,
      instalments: enrichedInstalments,
      payments: payments || [],
      receipts: receipts || [],
      riskFlag: riskFlag || null,
      reminders: reminders || [],
      refundRequest: refundRequest || null,
    })
  } catch (err) {
    next(err)
  }
}

export async function recordStudentPayment(req, res, next) {
  try {
    const { studentId } = req.params
    const { instalmentId, amountPaise, method, gatewayRef, paidAt, idempotencyKey } = req.body

    const cleanId = studentId.trim().toUpperCase()

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await Payment.findOne({ idempotencyKey }).lean()
      if (existing) {
        const receipt = await Receipt.findOne({ paymentId: existing._id }).lean()
        const instalment = await Instalment.findById(existing.instalmentId).lean()
        return successResponse(res, {
          payment: existing,
          receipt,
          instalment,
          idempotentReplay: true,
        })
      }
    }

    // 2. Validate Instalment
    const instalment = await Instalment.findById(instalmentId)
    if (!instalment) {
      throw new AppError('Instalment not found', 404, 'NOT_FOUND')
    }
    if (instalment.studentId !== cleanId) {
      throw new AppError('Instalment does not belong to this student', 400, 'BAD_REQUEST')
    }

    const currentBalance = Math.max(0, instalment.amountPaise - (instalment.paidPaise || 0))
    const payAmount = parseInt(amountPaise, 10)

    if (isNaN(payAmount) || payAmount <= 0) {
      throw new AppError('Payment amount must be greater than 0 paise', 400, 'INVALID_AMOUNT')
    }
    if (payAmount > currentBalance) {
      throw new AppError(
        `Payment amount (₹${(payAmount / 100).toFixed(2)}) exceeds instalment balance (₹${(currentBalance / 100).toFixed(2)})`,
        400,
        'OVERPAYMENT'
      )
    }

    const paymentDate = paidAt ? new Date(paidAt) : new Date()

    // 3. Create Payment record
    const payment = await Payment.create({
      instalmentId: instalment._id,
      studentId: cleanId,
      amountPaise: payAmount,
      method: method || 'cash',
      gatewayRef: gatewayRef || `OFF-${instalment.sequence}-${Date.now()}`,
      idempotencyKey: idempotencyKey || null,
      status: 'success',
      paidAt: paymentDate,
      source: 'accounts_offline',
    })

    // 4. Update Instalment
    instalment.paidPaise += payAmount
    if (instalment.paidPaise >= instalment.amountPaise) {
      instalment.paidAt = paymentDate
    }
    await instalment.save()

    // 5. Update FeePlan
    const plan = await FeePlan.findOne({ studentId: cleanId })
    if (plan) {
      plan.paidPaise = (plan.paidPaise || 0) + payAmount
      plan.balancePaise = Math.max(0, (plan.balancePaise || plan.netPayablePaise) - payAmount)
      await plan.save()
    }

    // 6. Generate Receipt with 18% GST breakdown
    const yearMonth = `${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000))
    const receiptNo = `RCP-${yearMonth}-${randomSuffix}`

    const taxableValuePaise = Math.round(payAmount / 1.18)
    const gstPaise = payAmount - taxableValuePaise

    const receipt = await Receipt.create({
      receiptNo,
      paymentId: payment._id,
      studentId: cleanId,
      amountPaise: payAmount,
      taxableValuePaise,
      gstPaise,
      gstRatePercent: 18,
      issuedAt: paymentDate,
    })

    // 7. Stop pending reminders if instalment is fully paid
    if (instalment.paidPaise >= instalment.amountPaise) {
      await ReminderLog.updateMany(
        { instalmentId: instalment._id, status: 'scheduled' },
        { status: 'skipped_paid' }
      )
    }

    return successResponse(
      res,
      {
        payment,
        receipt,
        instalment,
      },
      undefined,
      201
    )
  } catch (err) {
    next(err)
  }
}
