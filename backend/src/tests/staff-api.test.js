import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import bcrypt from 'bcryptjs'

import { app } from '../app.js'
import {
  User,
  Student,
  FeePlan,
  Instalment,
  Payment,
  Receipt,
  UnmatchedPayment,
  ReminderLog,
  RefundRequest,
  RiskFlag,
  AuditLog,
} from '../models/index.js'
import { signToken } from '../services/tokenService.js'

let mongoServer
let authCookie

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())

  // Create staff user
  const hashedPassword = await bcrypt.hash('Demo@1234', 10)
  const staff = await User.create({
    email: 'accounts@feedesk.demo',
    password: hashedPassword,
    name: 'Ramesh Gupta',
    role: 'accounts',
    centre: 'ALL',
    isActivated: true,
  })

  // Sign token
  const token = signToken({
    id: staff._id.toString(),
    role: staff.role,
    email: staff.email,
  })
  authCookie = `token=${token}`
}, 60000)

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
  }
}, 30000)

describe('Staff Accounts API Test Suite', () => {
  let sampleStudent
  let samplePlan
  let inst1
  let inst2

  beforeAll(async () => {
    // Seed sample student Ishita Sharma (STU-0587)
    sampleStudent = await Student.create({
      studentId: 'STU-0587',
      name: 'Ishita Sharma',
      centre: 'Jaipur Main',
      batch: 'JEE 2027 Morning',
      course: 'JEE',
      courseStart: new Date('2026-04-01'),
      courseEnd: new Date('2027-03-31'),
      guardianPhone: '9000000001',
      status: 'active',
    })

    samplePlan = await FeePlan.create({
      studentId: 'STU-0587',
      totalFeePaise: 12000000,
      discountPaise: 2000000,
      instalmentCount: 3,
    })

    // Instalment 1: ₹50,000 overdue by 45 days
    const pastDueDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    inst1 = await Instalment.create({
      studentId: 'STU-0587',
      planId: samplePlan._id,
      sequence: 1,
      dueDate: pastDueDate,
      amountPaise: 5000000,
      paidPaise: 0,
    })

    // Instalment 2: ₹50,000 upcoming in 60 days
    const futureDueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    inst2 = await Instalment.create({
      studentId: 'STU-0587',
      planId: samplePlan._id,
      sequence: 2,
      dueDate: futureDueDate,
      amountPaise: 5000000,
      paidPaise: 0,
    })

    // Scheduled reminder for inst1
    await ReminderLog.create({
      instalmentId: inst1._id,
      offsetKey: '3_days_before',
      channel: 'sms',
      language: 'en',
      status: 'scheduled',
      scheduledFor: pastDueDate,
    })

    // Sample Risk Flag
    await RiskFlag.create({
      studentId: 'STU-0587',
      score: 75,
      level: 'high',
      reasons: [
        { code: 'ATTENDANCE_DROP', label: 'Attendance dropped below 60%', points: 30 },
        { code: 'FEE_OVERDUE', label: 'Instalment overdue by 45 days', points: 45 },
      ],
      status: 'open',
    })

    // Sample Unmatched Payment
    await UnmatchedPayment.create({
      payload: {
        amountPaise: 2500000,
        method: 'upi',
        gatewayRef: 'UPI-TEST-9988',
        studentId: 'STU-0587',
      },
      reason: 'Reference mismatch in bank statement',
      status: 'open',
    })
  })

  test('1. GET /api/dashboard/summary calculates KPIs and ageing buckets', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.data.totalBilledPaise).toBe(10000000)
    expect(res.body.data.totalOverduePaise).toBe(5000000)
    expect(res.body.data.overdueStudentCount).toBe(1)
    expect(res.body.data.ageing['31_60']).toBe(5000000)
    expect(res.body.data.ageing.current).toBe(5000000)
  })

  test('2. GET /api/students lists students with balance and overdue info', async () => {
    const res = await request(app)
      .get('/api/students?search=Ishita')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.data.students.length).toBe(1)
    expect(res.body.data.students[0].studentId).toBe('STU-0587')
    expect(res.body.data.students[0].balancePaise).toBe(10000000)
    expect(res.body.data.students[0].daysOverdue).toBeGreaterThan(40)
    expect(res.body.data.students[0].riskLevel).toBe('high')
  })

  test('3. GET /api/students/:studentId returns complete student ledger', async () => {
    const res = await request(app)
      .get('/api/students/STU-0587')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Ishita Sharma')
    expect(res.body.data.instalments.length).toBe(2)
    expect(res.body.data.riskFlag).toBeDefined()
    expect(res.body.data.riskFlag.score).toBe(75)
    expect(res.body.data.reminders.length).toBe(1)
  })

  test('4. POST /api/students/:studentId/payments records cash payment, generates receipt, and stops reminders', async () => {
    const res = await request(app)
      .post('/api/students/STU-0587/payments')
      .set('Cookie', authCookie)
      .send({
        instalmentId: inst1._id.toString(),
        amountPaise: 5000000,
        method: 'cash',
        gatewayRef: 'CASH-RCP-001',
        paidAt: '2026-11-05',
        idempotencyKey: 'idemp_test_001',
      })

    expect(res.status).toBe(201)
    expect(res.body.data.payment.amountPaise).toBe(5000000)
    expect(res.body.data.receipt.receiptNo).toMatch(/^RCP-/)
    expect(res.body.data.receipt.gstRatePercent).toBe(18)
    expect(res.body.data.instalment.paidPaise).toBe(5000000)

    // Verify scheduled reminder was stopped
    const reminder = await ReminderLog.findOne({ instalmentId: inst1._id })
    expect(reminder.status).toBe('skipped_paid')
  })

  test('5. POST /api/refunds/calculate previews refund breakdown transparently without saving', async () => {
    const res = await request(app)
      .post('/api/refunds/calculate')
      .set('Cookie', authCookie)
      .send({
        studentId: 'STU-0587',
        leaveDate: '2026-06-15',
      })

    expect(res.status).toBe(200)
    expect(res.body.data.studentId).toBe('STU-0587')
    expect(res.body.data.breakdown.paidPaise).toBe(5000000)
    expect(res.body.data.breakdown.deductionPaise).toBe(500000)
    expect(res.body.data.breakdown.consumedPaise).toBeGreaterThan(0)
    expect(res.body.data.refundPaise).toBeGreaterThan(0)
    expect(res.body.data.payoutDueBy).toBeDefined()
  })

  test('6. POST /api/refunds creates a saved refund request and marks student left', async () => {
    const res = await request(app)
      .post('/api/refunds')
      .set('Cookie', authCookie)
      .send({
        studentId: 'STU-0587',
        leaveDate: '2026-06-15',
      })

    expect(res.status).toBe(201)
    expect(res.body.data.status).toBe('calculated')
    expect(res.body.data.refundPaise).toBeGreaterThan(0)

    const student = await Student.findOne({ studentId: 'STU-0587' })
    expect(student.status).toBe('left')
  })

  test('7. POST /api/payments/unmatched/:id/match matches payment to instalment', async () => {
    const openItem = await UnmatchedPayment.findOne({ status: 'open' })
    expect(openItem).toBeDefined()

    const res = await request(app)
      .post(`/api/payments/unmatched/${openItem._id}/match`)
      .set('Cookie', authCookie)
      .send({
        instalmentId: inst2._id.toString(),
      })

    expect(res.status).toBe(200)
    expect(res.body.data.matched).toBe(true)
    expect(res.body.data.receipt.receiptNo).toBeDefined()

    const updatedInst2 = await Instalment.findById(inst2._id)
    expect(updatedInst2.paidPaise).toBe(2500000)
  })

  test('8. POST /api/risk-flags/:id/false-flag marks flag false positive and logs audit', async () => {
    const flag = await RiskFlag.findOne({ studentId: 'STU-0587' })
    expect(flag).toBeDefined()

    const res = await request(app)
      .post(`/api/risk-flags/${flag._id}/false-flag`)
      .set('Cookie', authCookie)
      .send({
        note: 'Student was on approved medical leave and has cleared instalment offline.',
      })

    expect(res.status).toBe(200)
    expect(res.body.data.flag.status).toBe('false_flag')

    // Confirm AuditLog was recorded
    const audit = await AuditLog.findOne({ 'details.flagId': flag._id })
    expect(audit).toBeDefined()
    expect(audit.details.feesModified).toBe(false)
    expect(audit.details.messagesTriggered).toBe(false)
  })

  test('9. GET /api/dashboard/export/tally.csv exports CSV formatted for Tally', async () => {
    const res = await request(app)
      .get('/api/dashboard/export/tally.csv')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.text).toContain('StudentID,StudentName,Centre,Batch')
    expect(res.text).toContain('STU-0587')
  })
})
