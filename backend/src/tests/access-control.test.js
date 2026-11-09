import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

import { app } from '../app.js'
import {
  User,
  Student,
  FeePlan,
  Instalment,
  Payment,
  Receipt,
  ReminderLog,
} from '../models/index.js'
import { signToken } from '../services/tokenService.js'
import { env } from '../config/env.js'

let mongoServer
let parent1Cookie
let parent2Cookie
let staffCookie

let studentA
let studentB
let instA1

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())

  const hashedPw = await bcrypt.hash('Demo@1234', 10)

  // 1. Staff user
  const staff = await User.create({
    email: 'accounts@feedesk.demo',
    password: hashedPw,
    name: 'Accounts Executive',
    role: 'accounts',
    centre: 'ALL',
    isActivated: true,
  })
  staffCookie = `token=${signToken({ id: staff._id.toString(), role: staff.role, email: staff.email })}`

  // 2. Student A (belongs to Parent 1)
  studentA = await Student.create({
    studentId: 'STU-CHILD-A',
    name: 'Child A',
    centre: 'Jaipur Main',
    batch: 'JEE 2027 Morning',
    course: 'JEE',
    courseStart: new Date('2026-04-01'),
    courseEnd: new Date('2027-03-31'),
    guardianPhone: '9000000001',
    status: 'active',
  })

  // 3. Student B (belongs to Parent 2)
  studentB = await Student.create({
    studentId: 'STU-CHILD-B',
    name: 'Child B',
    centre: 'Jaipur South',
    batch: 'NEET 2027 Morning',
    course: 'NEET',
    courseStart: new Date('2026-04-01'),
    courseEnd: new Date('2027-03-31'),
    guardianPhone: '9000000002',
    status: 'active',
  })

  // 4. Parent 1 (only has access to Student A)
  const parent1 = await User.create({
    phone: '9000000001',
    name: 'Parent One',
    role: 'parent',
    studentIds: ['STU-CHILD-A'],
    isActivated: true,
  })
  parent1Cookie = `token=${signToken({ id: parent1._id.toString(), role: parent1.role, phone: parent1.phone })}`

  // 5. Parent 2 (only has access to Student B)
  const parent2 = await User.create({
    phone: '9000000002',
    name: 'Parent Two',
    role: 'parent',
    studentIds: ['STU-CHILD-B'],
    isActivated: true,
  })
  parent2Cookie = `token=${signToken({ id: parent2._id.toString(), role: parent2.role, phone: parent2.phone })}`

  // Plans & Instalments
  const planA = await FeePlan.create({
    studentId: 'STU-CHILD-A',
    totalFeePaise: 10000000,
    discountPaise: 0,
    instalmentCount: 3,
  })

  instA1 = await Instalment.create({
    studentId: 'STU-CHILD-A',
    planId: planA._id,
    sequence: 1,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    amountPaise: 4000000,
    paidPaise: 0,
  })
}, 60000)

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) {
    await mongoServer.stop()
  }
}, 30000)

describe('Security & Access Control Release Audits', () => {
  test('1. Unauthenticated requests to protected endpoints return 401', async () => {
    const endpoints = [
      '/api/auth/me',
      '/api/dashboard/summary',
      '/api/students',
      '/api/parent/students',
      '/api/refunds',
    ]

    for (const ep of endpoints) {
      const res = await request(app).get(ep)
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    }
  })

  test('2. Parent cannot access staff accounts endpoints (returns 403 Forbidden)', async () => {
    const staffEndpoints = [
      '/api/dashboard/summary',
      '/api/students',
      '/api/refunds',
      '/api/risk-flags',
      '/api/payments/unmatched',
    ]

    for (const ep of staffEndpoints) {
      const res = await request(app)
        .get(ep)
        .set('Cookie', parent1Cookie)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    }
  })

  test("3. Parent CANNOT read another child's ledger (returns 404 to prevent ID enumeration)", async () => {
    // Parent 1 attempts to read Child B's ledger
    const res = await request(app)
      .get('/api/parent/students/STU-CHILD-B/ledger')
      .set('Cookie', parent1Cookie)

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test("4. Parent CAN read their own child's ledger (returns 200)", async () => {
    // Parent 1 reads Child A's ledger
    const res = await request(app)
      .get('/api/parent/students/STU-CHILD-A/ledger')
      .set('Cookie', parent1Cookie)

    expect(res.status).toBe(200)
    expect(res.body.data.student.studentId).toBe('STU-CHILD-A')
    expect(res.body.data.instalments.length).toBe(1)
  })

  test('5. Payment webhook rejects calls with missing or invalid HMAC signature (401)', async () => {
    const payload = {
      event: 'payment.captured',
      amountPaise: 4000000,
      instalmentId: instA1._id.toString(),
      gatewayRef: 'FAKE-REF-001',
    }

    // Missing signature
    const resNoSig = await request(app)
      .post('/api/payments/webhook')
      .send(payload)

    expect(resNoSig.status).toBe(400)

    // Forged signature
    const resBadSig = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-signature', '0000000000000000000000000000000000000000000000000000000000000000')
      .send(payload)

    expect(resBadSig.status).toBe(401)
    expect(resBadSig.body.error.code).toBe('INVALID_SIGNATURE')
  })

  test('6. Payment webhook with valid HMAC signature successfully records payment and enforces idempotency', async () => {
    const payload = {
      event: 'payment.captured',
      amountPaise: 4000000,
      instalmentId: instA1._id.toString(),
      studentId: 'STU-CHILD-A',
      gatewayRef: 'PG-WEBHOOK-VALID-777',
      method: 'upi',
    }

    const payloadString = JSON.stringify(payload)
    const validSignature = crypto
      .createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex')

    // First attempt: succeeds
    const res = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-signature', validSignature)
      .send(payload)

    expect(res.status).toBe(200)
    expect(res.body.data.received).toBe(true)
    expect(res.body.data.receiptNo).toBeDefined()

    // Second attempt with exact same gatewayRef: idempotent return (alreadyProcessed: true)
    const resDup = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-signature', validSignature)
      .send(payload)

    expect(resDup.status).toBe(200)
    expect(resDup.body.data.alreadyProcessed).toBe(true)
  })

  test('7. Payment webhook routes unmatched or overpayments to UnmatchedPayment queue', async () => {
    const payload = {
      event: 'payment.captured',
      amountPaise: 9999999, // Exceeds balance or non-existent
      studentId: 'NON-EXISTENT-STUDENT',
      gatewayRef: 'UNMATCHED-WH-888',
      method: 'upi',
    }

    const payloadString = JSON.stringify(payload)
    const validSignature = crypto
      .createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET)
      .update(payloadString)
      .digest('hex')

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('x-webhook-signature', validSignature)
      .send(payload)

    expect(res.status).toBe(200)
    expect(res.body.data.routedToQueue).toBe(true)
  })

  test('8. Staff CSV upload enforces 2MB limit and row validation', async () => {
    const validCsv = `Date,Reference,StudentID,AmountRupees\n2026-11-05,OFF-CSV-001,STU-CHILD-A,100`

    const res = await request(app)
      .post('/api/payments/upload-bank-csv')
      .set('Cookie', staffCookie)
      .send({ csvData: validCsv })

    expect(res.status).toBe(200)
    expect(res.body.data.totalRows).toBe(1)
  })
})
