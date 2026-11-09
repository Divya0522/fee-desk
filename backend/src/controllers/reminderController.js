import { ReminderLog } from '../models/ReminderLog.js'
import { Instalment } from '../models/Instalment.js'
import { Student } from '../models/Student.js'
import { Consent } from '../models/Consent.js'
import { successResponse } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getReminders(req, res, next) {
  try {
    const { status, centre } = req.query

    const query = {}
    if (status && status !== 'ALL') {
      query.status = status
    }

    const logs = await ReminderLog.find(query).sort({ scheduledFor: -1, createdAt: -1 }).lean()
    const instalmentIds = logs.map((l) => l.instalmentId)

    const instalments = await Instalment.find({ _id: { $in: instalmentIds } }).lean()
    const instalmentMap = new Map(instalments.map((i) => [i._id.toString(), i]))

    const studentIds = [...new Set(instalments.map((i) => i.studentId))]
    const students = await Student.find({ studentId: { $in: studentIds } }).lean()
    const studentMap = new Map(students.map((s) => [s.studentId, s]))

    let enriched = logs.map((log) => {
      const inst = instalmentMap.get(log.instalmentId.toString())
      const student = inst ? studentMap.get(inst.studentId) : null
      return {
        ...log,
        studentId: inst?.studentId || '—',
        studentName: student?.name || inst?.studentId || '—',
        centre: student?.centre || '—',
        sequence: inst?.sequence || 1,
        amountPaise: inst?.amountPaise || 0,
        paidPaise: inst?.paidPaise || 0,
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

export async function runRemindersJob(req, res, next) {
  try {
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Find all instalments due soon or overdue
    const instalments = await Instalment.find({
      dueDate: { $lte: threeDaysLater },
    }).lean()

    let scheduledCount = 0
    let sentCount = 0
    let skippedPaidCount = 0
    let skippedNoOptinCount = 0

    // Get parent consents
    const consents = await Consent.find({}).lean()
    const consentMap = new Map(consents.map((c) => [c.studentId, c]))

    for (const inst of instalments) {
      const isPaid = inst.paidPaise >= inst.amountPaise
      const consent = consentMap.get(inst.studentId)
      const hasSmsOptin = consent ? consent.smsOptIn !== false : true // default opt-in in demo

      let offsetKey = '3_days_before'
      if (new Date(inst.dueDate) < now) {
        offsetKey = '3_days_after'
      }

      let log = await ReminderLog.findOne({
        instalmentId: inst._id,
        offsetKey,
      })

      if (!log) {
        let status = 'scheduled'
        if (isPaid) {
          status = 'skipped_paid'
          skippedPaidCount++
        } else if (!hasSmsOptin) {
          status = 'skipped_no_optin'
          skippedNoOptinCount++
        } else {
          status = 'sent'
          sentCount++
        }

        await ReminderLog.create({
          instalmentId: inst._id,
          offsetKey,
          channel: 'sms',
          language: 'hi',
          status,
          scheduledFor: now,
          sentAt: status === 'sent' ? now : null,
          messagePreview: `FeeDesk Reminder: Instalment #${inst.sequence} is due.`,
        })
        scheduledCount++
      } else {
        if (isPaid && log.status === 'scheduled') {
          log.status = 'skipped_paid'
          await log.save()
          skippedPaidCount++
        }
      }
    }

    return successResponse(res, {
      sentCount,
      skippedPaidCount,
      scheduledCount,
      skippedNoOptinCount,
      executedAt: now.toISOString(),
    })
  } catch (err) {
    next(err)
  }
}
