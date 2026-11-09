import { Instalment } from '../models/Instalment.js'
import { ReminderLog } from '../models/ReminderLog.js'
import { Consent } from '../models/Consent.js'
import { Student } from '../models/Student.js'
import { Attendance } from '../models/Attendance.js'
import { TestScore } from '../models/TestScore.js'
import { RiskFlag } from '../models/RiskFlag.js'
import { JobRun } from '../models/JobRun.js'
import { AuditLog } from '../models/AuditLog.js'

/**
 * Execute automated reminders evaluation job
 */
export async function executeRemindersJob(triggeredBy = 'system') {
  const startedAt = new Date()
  const jobRun = new JobRun({
    name: 'reminders',
    status: 'running',
    triggeredBy,
    startedAt,
  })
  await jobRun.save()

  try {
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const instalments = await Instalment.find({
      dueDate: { $lte: threeDaysLater },
    }).lean()

    let scheduledCount = 0
    let sentCount = 0
    let skippedPaidCount = 0
    let skippedNoOptinCount = 0

    const consents = await Consent.find({}).lean()
    const consentMap = new Map(consents.map((c) => [c.studentId, c]))

    for (const inst of instalments) {
      const isPaid = (inst.paidPaise || 0) >= inst.amountPaise
      const consent = consentMap.get(inst.studentId)
      const hasSmsOptin = consent ? consent.smsOptIn !== false : true

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

    const finishedAt = new Date()
    const durationMs = finishedAt.getTime() - startedAt.getTime()
    const resultSummary = `Evaluated ${instalments.length} instalments: ${sentCount} sent, ${skippedPaidCount} stopped (paid), ${skippedNoOptinCount} skipped`

    jobRun.status = 'success'
    jobRun.finishedAt = finishedAt
    jobRun.durationMs = durationMs
    jobRun.resultSummary = resultSummary
    jobRun.metrics = {
      evaluatedInstalments: instalments.length,
      sentCount,
      skippedPaidCount,
      scheduledCount,
      skippedNoOptinCount,
    }
    await jobRun.save()

    // Record AuditLog
    await AuditLog.create({
      action: 'run_job',
      entity: 'Job',
      entityId: 'reminders',
      actor: triggeredBy,
      performedBy: triggeredBy,
      summary: `Executed Reminders Job: ${sentCount} sent, ${skippedPaidCount} stopped`,
      details: jobRun.metrics,
    })

    return {
      runId: jobRun._id,
      name: 'reminders',
      status: 'success',
      durationMs,
      resultSummary,
      metrics: jobRun.metrics,
      executedAt: finishedAt.toISOString(),
    }
  } catch (err) {
    jobRun.status = 'failed'
    jobRun.finishedAt = new Date()
    jobRun.durationMs = jobRun.finishedAt.getTime() - startedAt.getTime()
    jobRun.error = err.message
    await jobRun.save()
    throw err
  }
}

/**
 * Execute automated dropout risk scoring job
 */
export async function executeRiskScoringJob(triggeredBy = 'system') {
  const startedAt = new Date()
  const jobRun = new JobRun({
    name: 'risk_scoring',
    status: 'running',
    triggeredBy,
    startedAt,
  })
  await jobRun.save()

  try {
    const students = await Student.find({ status: 'active' }).lean()
    let evaluatedCount = 0
    let flagsCreated = 0
    let flagsUpdated = 0

    const now = new Date()

    for (const student of students) {
      evaluatedCount++
      let score = 0
      const reasons = []

      // 1. Attendance check (last 30 days)
      const attendances = await Attendance.find({ studentId: student.studentId }).sort({ date: -1 }).limit(30).lean()
      if (attendances.length > 0) {
        const presentCount = attendances.filter((a) => a.status === 'present').length
        const rate = (presentCount / attendances.length) * 100
        if (rate < 60) {
          score += 30
          reasons.push({ code: 'ATTENDANCE_DROP', label: `Attendance rate dropped to ${Math.round(rate)}% (below 60%)`, points: 30 })
        } else if (rate < 75) {
          score += 15
          reasons.push({ code: 'ATTENDANCE_MODERATE', label: `Attendance rate at ${Math.round(rate)}% (below 75%)`, points: 15 })
        }
      }

      // 2. Overdue instalments check
      const overdueInsts = await Instalment.find({
        studentId: student.studentId,
        dueDate: { $lt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) },
      }).lean()

      const unpaidOverdue = overdueInsts.filter((i) => (i.paidPaise || 0) < i.amountPaise)
      if (unpaidOverdue.length > 0) {
        score += 25
        reasons.push({ code: 'OVERDUE_FEES', label: `${unpaidOverdue.length} instalment(s) overdue past 15+ days`, points: 25 })
      }

      // 3. Test score check (last 3 tests)
      const scores = await TestScore.find({ studentId: student.studentId }).sort({ date: -1 }).limit(3).lean()
      if (scores.length >= 2) {
        const latest = scores[0].score
        const prev = scores[1].score
        if (latest < 40 || prev - latest >= 20) {
          score += 25
          reasons.push({ code: 'SCORE_DROP', label: `Phase test score dip (latest: ${latest}/100)`, points: 25 })
        }
      }

      // Cap at 100
      score = Math.min(100, score)

      if (score >= 40) {
        const level = score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low'
        const existingFlag = await RiskFlag.findOne({ studentId: student.studentId, status: 'open' })

        if (existingFlag) {
          existingFlag.score = score
          existingFlag.level = level
          existingFlag.reasons = reasons
          await existingFlag.save()
          flagsUpdated++
        } else {
          await RiskFlag.create({
            studentId: student.studentId,
            score,
            level,
            reasons,
            status: 'open',
            counsellorNote: 'System generated alert based on attendance/test/fee signals.',
          })
          flagsCreated++
        }
      }
    }

    const finishedAt = new Date()
    const durationMs = finishedAt.getTime() - startedAt.getTime()
    const resultSummary = `Evaluated ${evaluatedCount} students: ${flagsCreated} new risk flags, ${flagsUpdated} refreshed`

    jobRun.status = 'success'
    jobRun.finishedAt = finishedAt
    jobRun.durationMs = durationMs
    jobRun.resultSummary = resultSummary
    jobRun.metrics = {
      evaluatedStudents: evaluatedCount,
      flagsCreated,
      flagsUpdated,
    }
    await jobRun.save()

    // Record AuditLog
    await AuditLog.create({
      action: 'run_job',
      entity: 'Job',
      entityId: 'risk_scoring',
      actor: triggeredBy,
      performedBy: triggeredBy,
      summary: `Executed Dropout Risk Job: ${evaluatedCount} students evaluated, ${flagsCreated} flags created`,
      details: jobRun.metrics,
    })

    return {
      runId: jobRun._id,
      name: 'risk_scoring',
      status: 'success',
      durationMs,
      resultSummary,
      metrics: jobRun.metrics,
      executedAt: finishedAt.toISOString(),
    }
  } catch (err) {
    jobRun.status = 'failed'
    jobRun.finishedAt = new Date()
    jobRun.durationMs = jobRun.finishedAt.getTime() - startedAt.getTime()
    jobRun.error = err.message
    await jobRun.save()
    throw err
  }
}
