import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'

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
  Consent,
  OtpRequest,
  Attendance,
  TestScore,
  AuditLog,
  Counter,
} from '../models/index.js'

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  await mongoose.connect(mongoUri)
}, 60000)

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
  }
}, 30000)

beforeEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

describe('Phase 1: App Setup & Core Models', () => {
  test('Health check endpoint returns ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('ok')
    expect(res.body.data.env).toBeDefined()
  })

  test('Counter model increments sequence atomically', async () => {
    const seq1 = await Counter.getNextSequence('receipt_seq_2026')
    const seq2 = await Counter.getNextSequence('receipt_seq_2026')
    expect(seq1).toBe(1)
    expect(seq2).toBe(2)
  })

  test('User model creates parent and staff with proper defaults and constraints', async () => {
    const parent = await User.create({
      role: 'parent',
      name: 'Rajesh Sharma',
      phone: '9000000001',
      studentIds: ['STU-0587'],
      language: 'hi',
    })
    expect(parent._id).toBeDefined()
    expect(parent.isActivated).toBe(false)
    expect(parent.failedAttempts).toBe(0)
    expect(parent.language).toBe('hi')

    const staff = await User.create({
      role: 'accounts',
      name: 'Anjali Verma',
      email: 'accounts@feedesk.demo',
      passwordHash: 'hashed_pw_test',
      centre: 'Jaipur Main',
    })
    expect(staff._id).toBeDefined()
    expect(staff.role).toBe('accounts')

    // Unique phone constraint check
    await expect(
      User.create({
        role: 'parent',
        name: 'Another Parent',
        phone: '9000000001',
      })
    ).rejects.toThrow()
  })

  test('Student model enforces unique studentId and course enum', async () => {
    const student = await Student.create({
      studentId: 'STU-0412',
      name: 'Aarav Meena',
      centre: 'Malviya Nagar',
      batch: 'JEE 2027 Morning',
      course: 'JEE',
      courseStart: new Date('2026-04-01'),
      courseEnd: new Date('2027-03-31'),
      guardianPhone: '9000000002',
    })
    expect(student._id).toBeDefined()
    expect(student.status).toBe('active')

    // Duplicate studentId rejection
    await expect(
      Student.create({
        studentId: 'STU-0412',
        name: 'Duplicate Student',
        centre: 'Kota',
        batch: 'JEE 2027',
        course: 'JEE',
        courseStart: new Date('2026-04-01'),
        courseEnd: new Date('2027-03-31'),
        guardianPhone: '9888888888',
      })
    ).rejects.toThrow()
  })

  test('FeePlan & Instalments enforce structure and uniqueness', async () => {
    const plan = await FeePlan.create({
      studentId: 'STU-0412',
      totalFeePaise: 12000000, // ₹1,20,000 in paise
      discountPaise: 1000000, // ₹10,000
      instalmentCount: 3,
      gstInclusive: true,
    })
    expect(plan._id).toBeDefined()

    const inst1 = await Instalment.create({
      studentId: 'STU-0412',
      planId: plan._id,
      sequence: 1,
      dueDate: new Date('2026-05-15'),
      amountPaise: 4000000,
    })
    expect(inst1.paidPaise).toBe(0)

    // Compound unique index (studentId + sequence)
    await expect(
      Instalment.create({
        studentId: 'STU-0412',
        planId: plan._id,
        sequence: 1,
        dueDate: new Date('2026-06-15'),
        amountPaise: 4000000,
      })
    ).rejects.toThrow()
  })

  test('Payment, Receipt, and UnmatchedPayment models', async () => {
    const payment = await Payment.create({
      studentId: 'STU-0412',
      amountPaise: 4000000,
      method: 'upi',
      gatewayRef: 'pay_gateway_ref_123',
      idempotencyKey: 'idem_key_abc_1',
      status: 'success',
      source: 'payment_link',
    })
    expect(payment._id).toBeDefined()

    const receipt = await Receipt.create({
      receiptNo: 'FD-2026-000001',
      paymentId: payment._id,
      studentId: 'STU-0412',
      amountPaise: 4000000,
      taxableValuePaise: 3389831,
      gstPaise: 610169,
      gstRatePercent: 18,
    })
    expect(receipt.receiptNo).toBe('FD-2026-000001')

    const unmatched = await UnmatchedPayment.create({
      payload: { rawWebhook: { id: 'evt_999' } },
      reason: 'No matching student or instalment reference found',
      status: 'open',
    })
    expect(unmatched.status).toBe('open')
  })

  test('ReminderLog uniqueness by (instalmentId, offsetKey)', async () => {
    const dummyInstId = new mongoose.Types.ObjectId()
    await ReminderLog.create({
      instalmentId: dummyInstId,
      offsetKey: '-7',
      channel: 'sms',
      language: 'hi',
      status: 'scheduled',
      scheduledFor: new Date('2026-05-08'),
      messagePreview: 'Test reminder',
    })

    // Duplicate (instalmentId, offsetKey)
    await expect(
      ReminderLog.create({
        instalmentId: dummyInstId,
        offsetKey: '-7',
        channel: 'sms',
        language: 'en',
        status: 'scheduled',
        scheduledFor: new Date('2026-05-08'),
      })
    ).rejects.toThrow()
  })

  test('RefundRequest and RiskFlag models validation', async () => {
    const refund = await RefundRequest.create({
      studentId: 'STU-0412',
      leaveDate: new Date('2026-05-01'),
      breakdown: { feePaid: 4000000, deduction: 200000, consumed: 800000, refund: 3000000 },
      refundPaise: 3000000,
      payoutDueBy: new Date('2026-05-11'),
      status: 'calculated',
    })
    expect(refund.policyVersion).toBe('v1.0')

    const risk = await RiskFlag.create({
      studentId: 'STU-0412',
      score: 65,
      level: 'high',
      reasons: [{ code: 'ATTENDANCE_DROP', label: 'Attendance fell below 60%', points: 30 }],
      status: 'open',
    })
    expect(risk.score).toBe(65)
    expect(risk.level).toBe('high')
  })

  test('Consent, OtpRequest, Attendance, TestScore, and AuditLog models', async () => {
    const userId = new mongoose.Types.ObjectId()
    const consent = await Consent.create({
      userId,
      studentId: 'STU-0412',
      guardianName: 'Suresh Meena',
      relationship: 'Father',
      policyVersion: 'v1.0',
      language: 'en',
      reminderOptIn: true,
    })
    expect(consent.reminderOptIn).toBe(true)

    const otp = await OtpRequest.create({
      phone: '9000000001',
      otpHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    })
    expect(otp.attempts).toBe(0)
    expect(otp.consumed).toBe(false)

    const attendance = await Attendance.create({
      studentId: 'STU-0412',
      date: new Date('2026-04-10'),
      status: 'present',
    })
    expect(attendance.status).toBe('present')

    const score = await TestScore.create({
      studentId: 'STU-0412',
      testName: 'Minor Test 1 - Physics',
      date: new Date('2026-04-20'),
      score: 85,
      maxScore: 100,
      batch: 'JEE 2027 Morning',
    })
    expect(score.score).toBe(85)

    const audit = await AuditLog.create({
      action: 'payment_created',
      entity: 'Payment',
      entityId: 'pay_123',
      performedBy: 'system',
      details: { amountPaise: 4000000 },
    })
    expect(audit.action).toBe('payment_created')
  })
})
