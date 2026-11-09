import { Student } from '../models/Student.js'
import { Instalment } from '../models/Instalment.js'
import { Payment } from '../models/Payment.js'
import { Receipt } from '../models/Receipt.js'
import { ReminderLog } from '../models/ReminderLog.js'
import { RiskFlag } from '../models/RiskFlag.js'
import { successResponse } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getDashboardSummary(req, res, next) {
  try {
    const { centre, batch } = req.query

    // 1. Filter students
    const studentQuery = {}
    if (centre && centre !== 'ALL') studentQuery.centre = centre
    if (batch && batch !== 'ALL') studentQuery.batch = batch

    const students = await Student.find(studentQuery, 'studentId centre batch status').lean()
    const studentIds = students.map((s) => s.studentId)

    if (studentIds.length === 0) {
      return successResponse(res, {
        totalBilledPaise: 0,
        totalCollectedPaise: 0,
        totalOutstandingPaise: 0,
        totalOverduePaise: 0,
        overdueStudentCount: 0,
        collectionPercent: 0,
        overduePercent: 0,
        ageing: { current: 0, '1_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 },
      })
    }

    // 2. Fetch all instalments for matching students
    const instalments = await Instalment.find({ studentId: { $in: studentIds } }).lean()

    const now = new Date()
    let totalBilledPaise = 0
    let totalCollectedPaise = 0
    let totalOutstandingPaise = 0
    let totalOverduePaise = 0

    const overdueStudentSet = new Set()
    const ageing = {
      current: 0,
      '1_30': 0,
      '31_60': 0,
      '61_90': 0,
      '90_plus': 0,
    }

    for (const inst of instalments) {
      const amount = inst.amountPaise || 0
      const paid = inst.paidPaise || 0
      const balance = Math.max(0, amount - paid)

      totalBilledPaise += amount
      totalCollectedPaise += paid
      totalOutstandingPaise += balance

      if (balance > 0) {
        const dueDate = new Date(inst.dueDate)
        const diffMs = now.getTime() - dueDate.getTime()
        const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (daysOverdue > 0) {
          totalOverduePaise += balance
          overdueStudentSet.add(inst.studentId)

          if (daysOverdue <= 30) {
            ageing['1_30'] += balance
          } else if (daysOverdue <= 60) {
            ageing['31_60'] += balance
          } else if (daysOverdue <= 90) {
            ageing['61_90'] += balance
          } else {
            ageing['90_plus'] += balance
          }
        } else {
          ageing.current += balance
        }
      }
    }

    const collectionPercent = totalBilledPaise > 0 ? (totalCollectedPaise / totalBilledPaise) * 100 : 0
    const overduePercent = totalBilledPaise > 0 ? (totalOverduePaise / totalBilledPaise) * 100 : 0

    return successResponse(res, {
      totalBilledPaise,
      totalCollectedPaise,
      totalOutstandingPaise,
      totalOverduePaise,
      overdueStudentCount: overdueStudentSet.size,
      collectionPercent: Math.round(collectionPercent * 10) / 10,
      overduePercent: Math.round(overduePercent * 10) / 10,
      ageing,
    })
  } catch (err) {
    next(err)
  }
}

export async function getDashboardByCentre(req, res, next) {
  try {
    const students = await Student.find({}, 'studentId centre').lean()
    const centreMap = {}

    for (const s of students) {
      if (!centreMap[s.centre]) {
        centreMap[s.centre] = {
          centre: s.centre,
          studentIds: [],
          billedPaise: 0,
          collectedPaise: 0,
          outstandingPaise: 0,
          overduePaise: 0,
        }
      }
      centreMap[s.centre].studentIds.push(s.studentId)
    }

    const allInstalments = await Instalment.find({}).lean()
    const studentInstMap = {}
    for (const inst of allInstalments) {
      if (!studentInstMap[inst.studentId]) {
        studentInstMap[inst.studentId] = []
      }
      studentInstMap[inst.studentId].push(inst)
    }

    const now = new Date()
    const result = Object.values(centreMap).map((c) => {
      let billed = 0
      let collected = 0
      let outstanding = 0
      let overdue = 0

      for (const sId of c.studentIds) {
        const insts = studentInstMap[sId] || []
        for (const inst of insts) {
          const b = Math.max(0, inst.amountPaise - (inst.paidPaise || 0))
          billed += inst.amountPaise
          collected += inst.paidPaise || 0
          outstanding += b
          if (b > 0 && new Date(inst.dueDate) < now) {
            overdue += b
          }
        }
      }

      const collectionPercent = billed > 0 ? Math.round((collected / billed) * 1000) / 10 : 0

      return {
        centre: c.centre,
        billedPaise: billed,
        collectedPaise: collected,
        outstandingPaise: outstanding,
        overduePaise: overdue,
        collectionPercent,
      }
    })

    return successResponse(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getDashboardByBatch(req, res, next) {
  try {
    const students = await Student.find({}, 'studentId batch').lean()
    const batchMap = {}

    for (const s of students) {
      if (!batchMap[s.batch]) {
        batchMap[s.batch] = {
          batch: s.batch,
          studentIds: [],
        }
      }
      batchMap[s.batch].studentIds.push(s.studentId)
    }

    const allInstalments = await Instalment.find({}).lean()
    const studentInstMap = {}
    for (const inst of allInstalments) {
      if (!studentInstMap[inst.studentId]) {
        studentInstMap[inst.studentId] = []
      }
      studentInstMap[inst.studentId].push(inst)
    }

    const now = new Date()
    const result = Object.values(batchMap).map((b) => {
      let billed = 0
      let collected = 0
      let outstanding = 0
      let overdue = 0

      for (const sId of b.studentIds) {
        const insts = studentInstMap[sId] || []
        for (const inst of insts) {
          const bal = Math.max(0, inst.amountPaise - (inst.paidPaise || 0))
          billed += inst.amountPaise
          collected += inst.paidPaise || 0
          outstanding += bal
          if (bal > 0 && new Date(inst.dueDate) < now) {
            overdue += bal
          }
        }
      }

      const collectionPercent = billed > 0 ? Math.round((collected / billed) * 1000) / 10 : 0

      return {
        batch: b.batch,
        billedPaise: billed,
        collectedPaise: collected,
        outstandingPaise: outstanding,
        overduePaise: overdue,
        collectionPercent,
      }
    })

    return successResponse(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getOverdueList(req, res, next) {
  try {
    const { minDays, centre, batch, page = 1, limit = 20 } = req.query

    const studentQuery = {}
    if (centre && centre !== 'ALL') studentQuery.centre = centre
    if (batch && batch !== 'ALL') studentQuery.batch = batch

    const students = await Student.find(studentQuery).lean()
    const studentMap = new Map(students.map((s) => [s.studentId, s]))
    const studentIds = Array.from(studentMap.keys())

    const now = new Date()
    const instalments = await Instalment.find({
      studentId: { $in: studentIds },
      dueDate: { $lt: now },
    }).lean()

    const overdueItems = []
    const minDaysNum = minDays !== undefined && minDays !== '' ? parseInt(minDays, 10) : null

    for (const inst of instalments) {
      const balancePaise = Math.max(0, inst.amountPaise - (inst.paidPaise || 0))
      if (balancePaise <= 0) continue

      const diffMs = now.getTime() - new Date(inst.dueDate).getTime()
      const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (minDaysNum !== null) {
        if (minDaysNum === 1 && (daysOverdue < 1 || daysOverdue > 30)) continue
        if (minDaysNum === 31 && (daysOverdue < 31 || daysOverdue > 60)) continue
        if (minDaysNum === 61 && (daysOverdue < 61 || daysOverdue > 90)) continue
        if (minDaysNum === 90 && daysOverdue < 90) continue
        if (![1, 31, 61, 90].includes(minDaysNum) && daysOverdue < minDaysNum) continue
      }

      const student = studentMap.get(inst.studentId)
      overdueItems.push({
        instalmentId: inst._id,
        sequence: inst.sequence,
        studentId: inst.studentId,
        studentName: student?.name || inst.studentId,
        centre: student?.centre || '—',
        batch: student?.batch || '—',
        balancePaise,
        dueDate: inst.dueDate,
        daysOverdue,
      })
    }

    // Sort by daysOverdue descending
    overdueItems.sort((a, b) => b.daysOverdue - a.daysOverdue)

    // Lookup latest reminder for each instalment
    const instIds = overdueItems.map((item) => item.instalmentId)
    const reminderLogs = await ReminderLog.find({ instalmentId: { $in: instIds } }).lean()
    const reminderMap = new Map()
    for (const log of reminderLogs) {
      reminderMap.set(log.instalmentId.toString(), log)
    }

    // Lookup risk flags for students in overdue list
    const studentIdList = [...new Set(overdueItems.map((i) => i.studentId))]
    const riskFlags = await RiskFlag.find({ studentId: { $in: studentIdList }, status: 'open' }).lean()
    const riskMap = new Map(riskFlags.map((rf) => [rf.studentId, rf]))

    for (const item of overdueItems) {
      const log = reminderMap.get(item.instalmentId.toString())
      item.lastReminderDate = log?.sentAt || log?.scheduledFor || null
      item.lastReminderStatus = log?.status || null
      const rf = riskMap.get(item.studentId)
      item.riskLevel = rf?.level || 'low'
      item.riskScore = rf?.score || 0
    }

    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 10
    const total = overdueItems.length
    const totalPages = Math.ceil(total / limitNum) || 1
    const paginatedItems = overdueItems.slice((pageNum - 1) * limitNum, pageNum * limitNum)

    return successResponse(res, paginatedItems, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    })
  } catch (err) {
    next(err)
  }
}

export async function exportTallyCsv(req, res, next) {
  try {
    const { from, to } = req.query

    const paymentQuery = { status: 'success' }
    if (from || to) {
      paymentQuery.paidAt = {}
      if (from) paymentQuery.paidAt.$gte = new Date(from)
      if (to) paymentQuery.paidAt.$lte = new Date(new Date(to).setHours(23, 59, 59, 999))
    }

    const payments = await Payment.find(paymentQuery).sort({ paidAt: -1 }).lean()
    const studentIds = [...new Set(payments.map((p) => p.studentId))]
    const students = await Student.find({ studentId: { $in: studentIds } }).lean()
    const studentMap = new Map(students.map((s) => [s.studentId, s]))

    const paymentIds = payments.map((p) => p._id)
    const receipts = await Receipt.find({ paymentId: { $in: paymentIds } }).lean()
    const receiptMap = new Map(receipts.map((r) => [r.paymentId.toString(), r]))

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="tally_export.csv"')

    let csvContent = 'Date,VoucherType,VoucherNo,StudentID,StudentName,Centre,Batch,LedgerName,AmountRupees,PaymentMode,GatewayRef,GSTAmountRupees\r\n'

    for (const p of payments) {
      const student = studentMap.get(p.studentId)
      const receipt = receiptMap.get(p._id.toString())
      const dateStr = new Date(p.paidAt).toISOString().slice(0, 10)
      const amountRupees = (p.amountPaise / 100).toFixed(2)
      const gstRupees = receipt ? (receipt.gstPaise / 100).toFixed(2) : '0.00'
      const voucherNo = receipt?.receiptNo || `VCH-${p._id.toString().slice(-6)}`

      const row = [
        dateStr,
        'Receipt',
        voucherNo,
        p.studentId,
        `"${(student?.name || '').replace(/"/g, '""')}"`,
        `"${(student?.centre || '').replace(/"/g, '""')}"`,
        `"${(student?.batch || '').replace(/"/g, '""')}"`,
        'Coaching Tuition Fees',
        amountRupees,
        p.method.toUpperCase(),
        p.gatewayRef || '—',
        gstRupees,
      ].join(',')

      csvContent += row + '\r\n'
    }

    return res.status(200).send(csvContent)
  } catch (err) {
    next(err)
  }
}
