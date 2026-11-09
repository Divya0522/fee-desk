import crypto from 'crypto'
import { env } from '../config/env.js'
import { UnmatchedPayment } from '../models/UnmatchedPayment.js'
import { Instalment } from '../models/Instalment.js'
import { Student } from '../models/Student.js'
import { FeePlan } from '../models/FeePlan.js'
import { Payment } from '../models/Payment.js'
import { Receipt } from '../models/Receipt.js'
import { ReminderLog } from '../models/ReminderLog.js'
import { successResponse } from '../utils/response.js'
import { AppError } from '../middleware/errorHandler.js'

export async function getUnmatchedPayments(req, res, next) {
  try {
    const { status = 'open' } = req.query
    const query = {}
    if (status && status !== 'ALL') {
      query.status = status
    }

    const items = await UnmatchedPayment.find(query).sort({ createdAt: -1 }).lean()
    return successResponse(res, items)
  } catch (err) {
    next(err)
  }
}

export async function matchUnmatchedPayment(req, res, next) {
  try {
    const { id } = req.params
    const { instalmentId } = req.body

    if (!instalmentId) {
      throw new AppError('instalmentId is required', 400, 'BAD_REQUEST')
    }

    const unmatched = await UnmatchedPayment.findById(id)
    if (!unmatched) {
      throw new AppError('Unmatched payment record not found', 404, 'NOT_FOUND')
    }
    if (unmatched.status !== 'open') {
      throw new AppError(`Cannot match payment with status ${unmatched.status}`, 400, 'INVALID_STATE')
    }

    const instalment = await Instalment.findById(instalmentId)
    if (!instalment) {
      throw new AppError('Instalment not found', 404, 'NOT_FOUND')
    }

    const amountPaise = unmatched.payload?.amountPaise || 0
    if (amountPaise <= 0) {
      throw new AppError('Unmatched payment has invalid amount', 400, 'BAD_REQUEST')
    }

    const currentBalance = Math.max(0, instalment.amountPaise - (instalment.paidPaise || 0))
    if (amountPaise > currentBalance) {
      throw new AppError(
        `Payment amount ₹${(amountPaise / 100).toFixed(2)} exceeds instalment balance ₹${(currentBalance / 100).toFixed(2)}`,
        400,
        'OVERPAYMENT'
      )
    }

    const paymentDate = new Date()

    // 1. Create real Payment
    const payment = await Payment.create({
      instalmentId: instalment._id,
      studentId: instalment.studentId,
      amountPaise,
      method: unmatched.payload?.method || 'upi',
      gatewayRef: unmatched.payload?.gatewayRef || `UNMATCH-${Date.now()}`,
      status: 'success',
      paidAt: paymentDate,
      source: 'unmatched_resolved',
    })

    // 2. Update Instalment
    instalment.paidPaise += amountPaise
    if (instalment.paidPaise >= instalment.amountPaise) {
      instalment.paidAt = paymentDate
    }
    await instalment.save()

    // 3. Update FeePlan
    const plan = await FeePlan.findOne({ studentId: instalment.studentId })
    if (plan) {
      plan.paidPaise = (plan.paidPaise || 0) + amountPaise
      plan.balancePaise = Math.max(0, (plan.balancePaise || plan.netPayablePaise) - amountPaise)
      await plan.save()
    }

    // 4. Generate Receipt
    const yearMonth = `${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000))
    const receiptNo = `RCP-${yearMonth}-${randomSuffix}`

    const taxableValuePaise = Math.round(amountPaise / 1.18)
    const gstPaise = amountPaise - taxableValuePaise

    const receipt = await Receipt.create({
      receiptNo,
      paymentId: payment._id,
      studentId: instalment.studentId,
      amountPaise,
      taxableValuePaise,
      gstPaise,
      gstRatePercent: 18,
      issuedAt: paymentDate,
    })

    // 5. Update Reminders if instalment paid
    if (instalment.paidPaise >= instalment.amountPaise) {
      await ReminderLog.updateMany(
        { instalmentId: instalment._id, status: 'scheduled' },
        { status: 'skipped_paid' }
      )
    }

    // 6. Mark unmatched payment resolved
    unmatched.status = 'matched'
    unmatched.resolvedBy = req.user?.id || null
    unmatched.resolvedAt = paymentDate
    await unmatched.save()

    return successResponse(res, {
      matched: true,
      payment,
      receipt,
      instalment,
    })
  } catch (err) {
    next(err)
  }
}

export async function rejectUnmatchedPayment(req, res, next) {
  try {
    const { id } = req.params
    const { reason } = req.body

    const unmatched = await UnmatchedPayment.findById(id)
    if (!unmatched) {
      throw new AppError('Unmatched payment record not found', 404, 'NOT_FOUND')
    }
    if (unmatched.status !== 'open') {
      throw new AppError(`Cannot reject payment with status ${unmatched.status}`, 400, 'INVALID_STATE')
    }

    unmatched.status = 'rejected'
    if (reason) unmatched.reason = reason
    unmatched.resolvedBy = req.user?.id || null
    unmatched.resolvedAt = new Date()
    await unmatched.save()

    return successResponse(res, {
      rejected: true,
      item: unmatched,
    })
  } catch (err) {
    next(err)
  }
}

export async function handlePaymentWebhook(req, res, next) {
  try {
    const signature = req.headers['x-webhook-signature'] || req.headers['x-razorpay-signature']
    if (!signature) {
      throw new AppError('Missing webhook signature', 400, 'UNAUTHORIZED_WEBHOOK')
    }

    const payloadString = JSON.stringify(req.body)
    const expectedSignature = crypto
      .createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex')

    const sigBuf = Buffer.from(signature, 'utf8')
    const expBuf = Buffer.from(expectedSignature, 'utf8')
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new AppError('Invalid webhook signature', 401, 'INVALID_SIGNATURE')
    }

    const { gatewayRef, amountPaise, instalmentId, studentId, method = 'upi' } = req.body

    // Idempotency check
    if (gatewayRef) {
      const existing = await Payment.findOne({ gatewayRef })
      if (existing) {
        return successResponse(res, { received: true, alreadyProcessed: true })
      }
    }

    let instalment = null
    if (instalmentId) {
      instalment = await Instalment.findById(instalmentId)
    }

    if (!instalment && studentId) {
      instalment = await Instalment.findOne({
        studentId: studentId.toUpperCase(),
        $expr: { $gt: ['$amountPaise', '$paidPaise'] },
      }).sort({ sequence: 1 })
    }

    if (!instalment) {
      const unmatched = await UnmatchedPayment.create({
        payload: req.body,
        reason: 'No unpaid instalment found matching payment payload',
        status: 'open',
      })
      return successResponse(res, { received: true, routedToQueue: true, unmatchedId: unmatched._id })
    }

    const currentBalance = Math.max(0, instalment.amountPaise - (instalment.paidPaise || 0))
    if (amountPaise > currentBalance) {
      const unmatched = await UnmatchedPayment.create({
        payload: req.body,
        reason: `Overpayment: Amount ₹${(amountPaise / 100).toFixed(2)} exceeds balance ₹${(currentBalance / 100).toFixed(2)}`,
        status: 'open',
      })
      return successResponse(res, { received: true, routedToQueue: true, reason: 'overpayment' })
    }

    const payment = await Payment.create({
      instalmentId: instalment._id,
      studentId: instalment.studentId,
      amountPaise,
      method,
      gatewayRef: gatewayRef || `WH-${Date.now()}`,
      status: 'success',
      paidAt: new Date(),
      source: 'webhook',
    })

    instalment.paidPaise += amountPaise
    if (instalment.paidPaise >= instalment.amountPaise) {
      instalment.paidAt = new Date()
      await ReminderLog.updateMany(
        { instalmentId: instalment._id, status: 'scheduled' },
        { status: 'skipped_paid' }
      )
    }
    await instalment.save()

    const yearMonth = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000))
    const receiptNo = `RCP-${yearMonth}-${randomSuffix}`
    const taxableValuePaise = Math.round(amountPaise / 1.18)
    const gstPaise = amountPaise - taxableValuePaise

    const receipt = await Receipt.create({
      receiptNo,
      paymentId: payment._id,
      studentId: instalment.studentId,
      amountPaise,
      taxableValuePaise,
      gstPaise,
      gstRatePercent: 18,
      issuedAt: new Date(),
    })

    return successResponse(res, { received: true, paymentId: payment._id, receiptNo: receipt.receiptNo })
  } catch (err) {
    next(err)
  }
}

export async function handleMockCheckout(req, res, next) {
  try {
    const { token } = req.params
    const { method = 'upi' } = req.body

    const instalment = await Instalment.findOne({ paymentLinkToken: token })
    if (!instalment) {
      throw new AppError('Payment link expired or invalid.', 404, 'NOT_FOUND')
    }

    const currentBalance = Math.max(0, instalment.amountPaise - (instalment.paidPaise || 0))
    if (currentBalance <= 0) {
      throw new AppError('This instalment has already been paid.', 400, 'ALREADY_PAID')
    }

    const paymentDate = new Date()
    const payment = await Payment.create({
      instalmentId: instalment._id,
      studentId: instalment.studentId,
      amountPaise: currentBalance,
      method,
      gatewayRef: `MOCK-${Date.now()}`,
      status: 'success',
      paidAt: paymentDate,
      source: 'payment_link',
    })

    instalment.paidPaise += currentBalance
    instalment.paidAt = paymentDate
    await instalment.save()

    await ReminderLog.updateMany(
      { instalmentId: instalment._id, status: 'scheduled' },
      { status: 'skipped_paid' }
    )

    const yearMonth = `${paymentDate.getFullYear()}${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000))
    const receiptNo = `RCP-${yearMonth}-${randomSuffix}`
    const taxableValuePaise = Math.round(currentBalance / 1.18)
    const gstPaise = currentBalance - taxableValuePaise

    const receipt = await Receipt.create({
      receiptNo,
      paymentId: payment._id,
      studentId: instalment.studentId,
      amountPaise: currentBalance,
      taxableValuePaise,
      gstPaise,
      gstRatePercent: 18,
      issuedAt: paymentDate,
    })

    return successResponse(res, {
      success: true,
      receiptNo: receipt.receiptNo,
      amountPaidPaise: currentBalance,
    })
  } catch (err) {
    next(err)
  }
}

export async function handleBankCsvUpload(req, res, next) {
  try {
    const { csvData } = req.body
    if (!csvData || typeof csvData !== 'string') {
      throw new AppError('csvData must be a non-empty string', 400, 'BAD_REQUEST')
    }

    if (Buffer.byteLength(csvData, 'utf8') > 2 * 1024 * 1024) {
      throw new AppError('CSV size exceeds maximum limit of 2MB', 413, 'PAYLOAD_TOO_LARGE')
    }

    const lines = csvData.trim().split(/\r?\n/)
    if (lines.length < 2) {
      throw new AppError('CSV must contain a header row and at least one data row', 400, 'EMPTY_CSV')
    }

    const results = {
      totalRows: lines.length - 1,
      matched: 0,
      queued: 0,
      errors: [],
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))
      if (cols.length < 4) {
        results.errors.push({ row: i, error: 'Insufficient columns' })
        continue
      }

      const [dateStr, ref, studentId, amountStr] = cols
      const amountPaise = Math.round(parseFloat(amountStr) * 100)

      if (isNaN(amountPaise) || amountPaise <= 0) {
        results.errors.push({ row: i, error: 'Invalid amount' })
        continue
      }

      const existing = await Payment.findOne({ gatewayRef: ref })
      if (existing) {
        continue
      }

      const student = await Student.findOne({ studentId: studentId.toUpperCase() })
      if (!student) {
        await UnmatchedPayment.create({
          payload: { dateStr, gatewayRef: ref, studentId, amountPaise, method: 'bank_transfer' },
          reason: `Student ${studentId} not found in database`,
          status: 'open',
        })
        results.queued++
        continue
      }

      const instalment = await Instalment.findOne({
        studentId: student.studentId,
        $expr: { $gt: ['$amountPaise', '$paidPaise'] },
      }).sort({ sequence: 1 })

      if (!instalment) {
        await UnmatchedPayment.create({
          payload: { dateStr, gatewayRef: ref, studentId, amountPaise, method: 'bank_transfer' },
          reason: 'No open unpaid instalments for this student',
          status: 'open',
        })
        results.queued++
        continue
      }

      const bal = Math.max(0, instalment.amountPaise - (instalment.paidPaise || 0))
      if (amountPaise > bal) {
        await UnmatchedPayment.create({
          payload: { dateStr, gatewayRef: ref, studentId, amountPaise, instalmentId: instalment._id, method: 'bank_transfer' },
          reason: `Overpayment: Amount ₹${(amountPaise / 100).toFixed(2)} exceeds instalment balance ₹${(bal / 100).toFixed(2)}`,
          status: 'open',
        })
        results.queued++
        continue
      }

      const payment = await Payment.create({
        instalmentId: instalment._id,
        studentId: student.studentId,
        amountPaise,
        method: 'bank_transfer',
        gatewayRef: ref,
        status: 'success',
        paidAt: new Date(dateStr) || new Date(),
        source: 'csv_upload',
      })

      instalment.paidPaise += amountPaise
      if (instalment.paidPaise >= instalment.amountPaise) {
        instalment.paidAt = new Date()
        await ReminderLog.updateMany(
          { instalmentId: instalment._id, status: 'scheduled' },
          { status: 'skipped_paid' }
        )
      }
      await instalment.save()

      results.matched++
    }

    return successResponse(res, results)
  } catch (err) {
    next(err)
  }
}
