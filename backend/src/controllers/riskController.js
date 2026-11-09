import { RiskFlag } from '../models/RiskFlag.js'
import { Student } from '../models/Student.js'
import { AuditLog } from '../models/AuditLog.js'
import { successResponse } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getRiskFlags(req, res, next) {
  try {
    const { status = 'open', level, centre } = req.query

    const query = {}
    if (status && status !== 'ALL') {
      query.status = status
    }
    if (level && level !== 'ALL') {
      query.level = level
    }

    const flags = await RiskFlag.find(query).sort({ score: -1, createdAt: -1 }).lean()
    const studentIds = [...new Set(flags.map((f) => f.studentId))]
    const students = await Student.find({ studentId: { $in: studentIds } }).lean()
    const studentMap = new Map(students.map((s) => [s.studentId, s]))

    let enriched = flags.map((f) => {
      const student = studentMap.get(f.studentId)
      return {
        ...f,
        studentName: student?.name || f.studentId,
        centre: student?.centre || '—',
        batch: student?.batch || '—',
      }
    })

    if (centre && centre !== 'ALL') {
      enriched = enriched.filter((f) => f.centre === centre)
    }

    return successResponse(res, enriched)
  } catch (err) {
    next(err)
  }
}

export async function markRiskFlagContacted(req, res, next) {
  try {
    const { id } = req.params
    const { note } = req.body

    const flag = await RiskFlag.findById(id)
    if (!flag) {
      throw new AppError('Risk flag not found', 404, 'NOT_FOUND')
    }

    flag.status = 'contacted'
    if (note) {
      flag.counsellorNote = note
    }
    flag.markedBy = req.user?.id || null
    await flag.save()

    return successResponse(res, flag)
  } catch (err) {
    next(err)
  }
}

export async function markRiskFlagFalse(req, res, next) {
  try {
    const { id } = req.params
    const { note } = req.body

    if (!note || !note.trim()) {
      throw new AppError('A note explaining why this is a false flag is required.', 400, 'NOTE_REQUIRED')
    }

    const flag = await RiskFlag.findById(id)
    if (!flag) {
      throw new AppError('Risk flag not found', 404, 'NOT_FOUND')
    }

    flag.status = 'false_flag'
    flag.counsellorNote = note.trim()
    flag.markedBy = req.user?.id || null
    await flag.save()

    // Audit log confirmation: Flags never change fees or send automated messages
    await AuditLog.create({
      action: 'RISK_FLAG_FALSE_POSITIVE',
      entity: 'RiskFlag',
      entityId: flag._id.toString(),
      performedBy: req.user?.id || 'staff',
      details: {
        flagId: flag._id,
        studentId: flag.studentId,
        note: note.trim(),
        feesModified: false,
        messagesTriggered: false,
      },
    })

    return successResponse(res, {
      flag,
      message: 'Flag marked as false positive. No fees or messages were altered.',
    })
  } catch (err) {
    next(err)
  }
}

export async function resolveRiskFlag(req, res, next) {
  try {
    const { id } = req.params

    const flag = await RiskFlag.findById(id)
    if (!flag) {
      throw new AppError('Risk flag not found', 404, 'NOT_FOUND')
    }

    flag.status = 'resolved'
    flag.markedBy = req.user?.id || null
    await flag.save()

    return successResponse(res, flag)
  } catch (err) {
    next(err)
  }
}
