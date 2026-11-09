import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../config/db.js'
import { env } from '../config/env.js'
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
  Attendance,
  TestScore,
  Counter,
  AuditLog,
  JobRun,
} from '../models/index.js'

const CENTRES = ['Jaipur Main', 'Jaipur South', 'Kota', 'Sikar']
const BATCHES = [
  { batch: 'JEE 2027 Morning', course: 'JEE' },
  { batch: 'JEE 2027 Evening', course: 'JEE' },
  { batch: 'NEET 2027 Morning', course: 'NEET' },
  { batch: 'NEET 2027 Evening', course: 'NEET' },
  { batch: 'JEE 2028', course: 'JEE' },
  { batch: 'NEET 2028', course: 'NEET' },
]

const FIRST_NAMES = [
  'Aarav', 'Ishita', 'Mohit', 'Ananya', 'Rohan', 'Pooja', 'Vikram', 'Divya',
  'Aditya', 'Neha', 'Karan', 'Priya', 'Siddharth', 'Ritu', 'Manish', 'Kavita',
  'Deepak', 'Sneha', 'Rahul', 'Simran', 'Gaurav', 'Meera', 'Alok', 'Tanvi',
  'Akash', 'Swati', 'Nikhil', 'Sunita', 'Rajesh', 'Shweta', 'Harsh', 'Anjali',
]

const LAST_NAMES = [
  'Sharma', 'Meena', 'Gurjar', 'Verma', 'Rathore', 'Choudhary', 'Gupta', 'Singh',
  'Joshi', 'Yadav', 'Agarwal', 'Mishra', 'Saini', 'Bhardwaj', 'Tiwari', 'Kumawat',
]

export async function runSeed({ reset = false } = {}) {
  if (env.NODE_ENV === 'production') {
    console.error('Refusing to run seed in production environment!')
    process.exit(1)
  }

  await connectDB()
  console.log(`\nConnected to MongoDB for seeding (${reset ? 'RESET & SEED' : 'SEED'})...`)

  if (reset) {
    console.log('Clearing existing collections...')
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      FeePlan.deleteMany({}),
      Instalment.deleteMany({}),
      Payment.deleteMany({}),
      Receipt.deleteMany({}),
      UnmatchedPayment.deleteMany({}),
      ReminderLog.deleteMany({}),
      RefundRequest.deleteMany({}),
      RiskFlag.deleteMany({}),
      Consent.deleteMany({}),
      Attendance.deleteMany({}),
      TestScore.deleteMany({}),
      Counter.deleteMany({}),
      JobRun.deleteMany({}),
    ])
  }

  const staffPasswordHash = await bcrypt.hash('Demo@1234', 10)

  // 1. Staff and Admin Users
  console.log('Creating staff and admin accounts...')
  await User.create([
    {
      role: 'admin',
      name: 'Vikramaditya Rathore',
      email: 'admin@feedesk.demo',
      passwordHash: staffPasswordHash,
      centre: 'ALL',
      language: 'en',
      isActive: true,
      isActivated: true,
    },
    {
      role: 'accounts',
      name: 'Anjali Verma',
      email: 'accounts@feedesk.demo',
      passwordHash: staffPasswordHash,
      centre: 'ALL',
      language: 'en',
      isActive: true,
      isActivated: true,
    },
    {
      role: 'accounts',
      name: 'Rohit Khandelwal',
      email: 'staff.active@feedesk.demo',
      passwordHash: staffPasswordHash,
      centre: 'Jaipur South',
      language: 'en',
      isActive: true,
      isActivated: true,
    },
    {
      role: 'accounts',
      name: 'Neha Singhal',
      email: 'staff.inactive@feedesk.demo',
      passwordHash: staffPasswordHash,
      centre: 'Kota',
      language: 'en',
      isActive: false, // Deactivated staff
      isActivated: true,
    },
  ])

  // 2. The 3 Sample Students
  console.log('Creating canonical sample students...')
  const sampleStudents = [
    {
      studentId: 'STU-0412',
      name: 'Aarav Meena',
      centre: 'Jaipur Main',
      batch: 'JEE 2027 Morning',
      course: 'JEE',
      courseStart: new Date('2026-04-01'),
      courseEnd: new Date('2027-03-31'),
      guardianPhone: '9000000002',
      status: 'active',
      guardianName: 'Suresh Meena',
      totalFee: 12000000, // ₹1,20,000
      paidInst1: 3000000,  // ₹30,000 (all paid)
      instalments: [
        { seq: 1, amount: 3000000, paid: 3000000, due: new Date('2026-10-10'), paidAt: new Date('2026-10-08') },
        { seq: 2, amount: 3000000, paid: 3000000, due: new Date('2026-12-15'), paidAt: new Date('2026-12-10') },
        { seq: 3, amount: 3000000, paid: 0, due: new Date('2027-02-15') },
        { seq: 4, amount: 3000000, paid: 0, due: new Date('2027-04-15') },
      ],
      isActivated: true,
    },
    {
      studentId: 'STU-0587',
      name: 'Ishita Sharma',
      centre: 'Jaipur Main',
      batch: 'JEE 2027 Evening',
      course: 'JEE',
      courseStart: new Date('2026-04-01'),
      courseEnd: new Date('2027-03-31'),
      guardianPhone: '9000000001',
      status: 'active',
      guardianName: 'Rajesh Sharma',
      totalFee: 12000000, // ₹1,20,000
      instalments: [
        { seq: 1, amount: 3000000, paid: 3000000, due: new Date('2026-07-10'), paidAt: new Date('2026-07-08') },
        { seq: 2, amount: 3000000, paid: 1500000, due: new Date('2026-10-10'), paidAt: new Date('2026-10-12') }, // overdue with ₹15,000 left
        { seq: 3, amount: 3000000, paid: 0, due: new Date('2027-01-15') },
        { seq: 4, amount: 3000000, paid: 0, due: new Date('2027-03-15') },
      ],
      isActivated: true,
    },
    {
      studentId: 'STU-0219',
      name: 'Mohit Gurjar',
      centre: 'Jaipur South',
      batch: 'NEET 2027 Morning',
      course: 'NEET',
      courseStart: new Date('2026-04-01'),
      courseEnd: new Date('2027-03-31'),
      guardianPhone: '9000000003',
      status: 'active',
      guardianName: '',
      totalFee: 12000000,
      instalments: [
        { seq: 1, amount: 4000000, paid: 0, due: new Date('2026-11-15') },
        { seq: 2, amount: 4000000, paid: 0, due: new Date('2027-01-15') },
        { seq: 3, amount: 4000000, paid: 0, due: new Date('2027-03-15') },
      ],
      isActivated: false, // NOT yet activated! Used for first-time parent activation demo
    },
  ]

  for (const s of sampleStudents) {
    const student = await Student.create({
      studentId: s.studentId,
      name: s.name,
      centre: s.centre,
      batch: s.batch,
      course: s.course,
      courseStart: s.courseStart,
      courseEnd: s.courseEnd,
      guardianPhone: s.guardianPhone,
      status: s.status,
    })

    const plan = await FeePlan.create({
      studentId: s.studentId,
      totalFeePaise: s.totalFee,
      discountPaise: 0,
      instalmentCount: s.instalments.length,
      gstInclusive: true,
    })

    for (const inst of s.instalments) {
      const createdInst = await Instalment.create({
        studentId: s.studentId,
        planId: plan._id,
        sequence: inst.seq,
        dueDate: inst.due,
        amountPaise: inst.amount,
        paidPaise: inst.paid,
        paidAt: inst.paidAt || null,
        paymentLinkToken: `pay_${s.studentId}_inst${inst.seq}`,
      })

      if (inst.paid > 0) {
        const payment = await Payment.create({
          instalmentId: createdInst._id,
          studentId: s.studentId,
          amountPaise: inst.paid,
          method: 'upi',
          gatewayRef: `PAY-${s.studentId}-${inst.seq}`,
          idempotencyKey: `seed_idem_${s.studentId}_${inst.seq}`,
          status: 'success',
          paidAt: inst.paidAt,
        })

        const seq = await Counter.getNextSequence('receipt_seq_2026')
        const receiptNo = `FD-2026-${String(seq).padStart(6, '0')}`
        const taxable = Math.round((inst.paid * 100) / 118)
        const gst = inst.paid - taxable

        await Receipt.create({
          receiptNo,
          paymentId: payment._id,
          studentId: s.studentId,
          amountPaise: inst.paid,
          taxableValuePaise: taxable,
          gstPaise: gst,
          gstRatePercent: 18,
          issuedAt: inst.paidAt,
        })
      }
    }

    // Create User account for parent
    const parentUser = await User.create({
      role: 'parent',
      name: s.guardianName || `${s.name}'s Parent`,
      phone: s.guardianPhone,
      studentIds: [s.studentId],
      isActivated: s.isActivated,
      language: 'en',
    })

    if (s.isActivated && s.guardianName) {
      await Consent.create({
        userId: parentUser._id,
        studentId: s.studentId,
        guardianName: s.guardianName,
        relationship: 'Father',
        policyVersion: 'v1.0',
        consentedAt: new Date('2026-04-05'),
        reminderOptIn: true,
      })
    }
  }

  // 3. Generate additional ~57 students across 4 centres and 6 batches
  console.log('Generating additional realistic student cohorts...')
  let studentCount = 3
  for (let i = 4; i <= 60; i++) {
    const studentId = `STU-${String(i).padStart(4, '0')}`
    const fn = FIRST_NAMES[i % FIRST_NAMES.length]
    const ln = LAST_NAMES[i % LAST_NAMES.length]
    const name = `${fn} ${ln}`
    const centre = CENTRES[i % CENTRES.length]
    const batchInfo = BATCHES[i % BATCHES.length]
    const phone = `98200${String(i).padStart(5, '0')}`

    const isLeft = i === 55 // One student who left with refund
    const status = isLeft ? 'left' : 'active'
    const leftOn = isLeft ? new Date('2026-06-15') : null

    const student = await Student.create({
      studentId,
      name,
      centre,
      batch: batchInfo.batch,
      course: batchInfo.course,
      courseStart: new Date('2026-04-01'),
      courseEnd: new Date('2027-03-31'),
      guardianPhone: phone,
      status,
      leftOn,
    })

    const totalFee = 12000000
    const discount = i % 5 === 0 ? 1000000 : 0 // Some with scholarship
    const plan = await FeePlan.create({
      studentId,
      totalFeePaise: totalFee,
      discountPaise: discount,
      instalmentCount: 4,
      gstInclusive: true,
    })

    // Spread: ~65% on track, ~20% overdue 1-30, ~10% overdue 31-60, ~5% overdue 60+
    const isOverdue60 = i % 20 === 0
    const isOverdue30 = !isOverdue60 && i % 10 === 0
    const isOverdueRecent = !isOverdue60 && !isOverdue30 && i % 5 === 0

    const inst1Paid = isOverdue60 ? 1000000 : 3000000
    const inst2Paid = isOverdue60 ? 0 : isOverdue30 ? 1500000 : isOverdueRecent ? 0 : 3000000

    const inst1 = await Instalment.create({
      studentId,
      planId: plan._id,
      sequence: 1,
      dueDate: new Date('2026-06-15'),
      amountPaise: 3000000,
      paidPaise: inst1Paid,
      paidAt: inst1Paid > 0 ? new Date('2026-06-12') : null,
      paymentLinkToken: `pay_${studentId}_1`,
    })

    const inst2 = await Instalment.create({
      studentId,
      planId: plan._id,
      sequence: 2,
      dueDate: new Date('2026-09-15'),
      amountPaise: 3000000,
      paidPaise: inst2Paid,
      paidAt: inst2Paid > 0 ? new Date('2026-09-14') : null,
      paymentLinkToken: `pay_${studentId}_2`,
    })

    await Instalment.create([
      {
        studentId,
        planId: plan._id,
        sequence: 3,
        dueDate: new Date('2026-12-15'),
        amountPaise: 3000000,
        paidPaise: 0,
        paymentLinkToken: `pay_${studentId}_3`,
      },
      {
        studentId,
        planId: plan._id,
        sequence: 4,
        dueDate: new Date('2027-03-15'),
        amountPaise: 3000000,
        paidPaise: 0,
        paymentLinkToken: `pay_${studentId}_4`,
      },
    ])

    // Generate Attendance (60 days) and Test Scores (6 tests)
    for (let d = 1; d <= 60; d++) {
      const isAbsent = (i % 7 === 0 && d > 45) || (d % 15 === 0)
      await Attendance.create({
        studentId,
        date: new Date(Date.now() - (60 - d) * 24 * 60 * 60 * 1000),
        status: isAbsent ? 'absent' : 'present',
      })
    }

    for (let t = 1; t <= 6; t++) {
      const dropPoints = (i % 8 === 0 && t > 3) ? 25 : 0
      const score = Math.max(35, 80 - dropPoints + (t * 2))
      await TestScore.create({
        studentId,
        testName: `Phase Assessment ${t}`,
        date: new Date(Date.now() - (6 - t) * 14 * 24 * 60 * 60 * 1000),
        score,
        maxScore: 100,
        batch: batchInfo.batch,
      })
    }

    // Create 2 open risk flags
    if (i === 10 || i === 20) {
      await RiskFlag.create({
        studentId,
        score: i === 10 ? 75 : 55,
        level: i === 10 ? 'high' : 'medium',
        reasons: [
          { code: 'ATTENDANCE_DROP', label: 'Attendance dropped below 60%', points: 30 },
          { code: 'OVERDUE_FEES', label: 'Overdue instalment past 30 days', points: 25 },
        ],
        status: 'open',
        counsellorNote: 'Parent contacted regarding attendance dip.',
      })
    }

    studentCount++
  }

  // 4. One student with a refund request
  console.log('Creating sample refund request...')
  await RefundRequest.create({
    studentId: 'STU-0055',
    leaveDate: new Date('2026-06-15'),
    breakdown: {
      feeAfterDiscountPaise: 12000000,
      paidPaise: 3000000,
      deductionPaise: 150000,
      daysElapsed: 75,
      totalCourseDays: 365,
      usedPercent: '20.5%',
      consumedPaise: 2460000,
      gstOnRetainedPaise: 398390,
      refundPaise: 390000,
    },
    refundPaise: 390000, // ₹3,900
    payoutDueBy: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days (urgent red badge)
    status: 'calculated',
    policyVersion: 'v1.0',
  })

  // 5. One unmatched payment in queue
  console.log('Creating sample unmatched payment in queue...')
  await UnmatchedPayment.create({
    payload: {
      id: 'pay_unmatched_demo_001',
      amountPaise: 3000000,
      reference: 'UPI/61298492019/HDFC',
      gatewayRef: 'pay_ext_98214',
    },
    reason: 'Student ID not referenced in payment remarks',
    status: 'open',
  })

  // 6. Reminder Logs
  console.log('Creating sample reminder automation logs...')
  const sampleInst = await Instalment.findOne({ studentId: 'STU-0587', sequence: 2 })
  if (sampleInst) {
    await ReminderLog.create([
      {
        instalmentId: sampleInst._id,
        offsetKey: '-7',
        channel: 'sms',
        language: 'hi',
        status: 'sent',
        scheduledFor: new Date('2026-10-03'),
        sentAt: new Date('2026-10-03'),
        messagePreview: 'नमस्ते, Ishita Sharma की ₹15,000 की किस्त 10 अक्टूबर को देय है।',
      },
      {
        instalmentId: sampleInst._id,
        offsetKey: '0',
        channel: 'whatsapp',
        language: 'hi',
        status: 'sent',
        scheduledFor: new Date('2026-10-10'),
        sentAt: new Date('2026-10-10'),
        messagePreview: 'नमस्ते, Ishita Sharma की ₹15,000 की किस्त आज देय है।',
      },
      {
        instalmentId: sampleInst._id,
        offsetKey: '+3',
        channel: 'sms',
        language: 'en',
        status: 'sent',
        scheduledFor: new Date('2026-10-13'),
        sentAt: new Date('2026-10-13'),
        messagePreview: 'Dear Parent, fee instalment of ₹15,000 for Ishita Sharma is 3 days overdue.',
      },
    ])
  }

  // Initial JobRuns
  console.log('Creating initial background job run records...')
  await JobRun.create([
    {
      name: 'reminders',
      status: 'success',
      triggeredBy: 'system',
      startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      finishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000 + 4500),
      durationMs: 4500,
      resultSummary: 'Evaluated 60 instalments: 18 sent, 42 skipped (paid or on track)',
      metrics: { sentCount: 18, skippedPaidCount: 35, scheduledCount: 7 },
    },
    {
      name: 'risk_scoring',
      status: 'success',
      triggeredBy: 'system',
      startedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      finishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 8200),
      durationMs: 8200,
      resultSummary: 'Evaluated 60 students: 2 high-risk, 1 medium-risk flags maintained',
      metrics: { evaluatedStudents: 60, highRisk: 2, mediumRisk: 1 },
    },
  ])

  // Initial Audit Logs
  console.log('Creating initial audit log history...')
  await AuditLog.create([
    {
      action: 'system_seed',
      entity: 'System',
      entityId: 'seed_2026',
      actor: 'system',
      performedBy: 'system',
      summary: 'Initialized FeeDesk database with seed cohorts and policies',
      details: { environment: 'demo', centres: 4, students: 60 },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      action: 'staff_login',
      entity: 'User',
      entityId: 'admin@feedesk.demo',
      actor: 'admin@feedesk.demo',
      performedBy: 'admin',
      summary: 'Admin logged into system',
      details: { ipAddress: '127.0.0.1' },
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
      action: 'run_job',
      entity: 'Job',
      entityId: 'reminders',
      actor: 'system',
      performedBy: 'system',
      summary: 'Automated daily cron: Reminders & Automation',
      details: { sentCount: 18, durationMs: 4500 },
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ])

  console.log('\n======================================================')
  console.log('✅ SEED COMPLETED SUCCESSFULLY!')
  console.log('======================================================')
  console.log('\nDEMO CREDENTIALS:')
  console.log('------------------------------------------------------')
  console.log('• System Admin:')
  console.log('  Email:    admin@feedesk.demo')
  console.log('  Password: Demo@1234')
  console.log('  Role:     admin (Centre: ALL)')
  console.log('\n• Accounts Executive:')
  console.log('  Email:    accounts@feedesk.demo')
  console.log('  Password: Demo@1234')
  console.log('  Role:     accounts (Centre: ALL)')
  console.log('\n• Extra Active Staff:')
  console.log('  Email:    staff.active@feedesk.demo')
  console.log('  Password: Demo@1234')
  console.log('\n• Extra Inactive Staff (Deactivated):')
  console.log('  Email:    staff.inactive@feedesk.demo')
  console.log('  Password: Demo@1234')
  console.log('\n• Parent (Active):')
  console.log('  Phone:    9000000001 (Ishita Sharma, ₹15,000 overdue)')
  console.log('  OTP:      123456')
  console.log('\n• Parent (Activation / Sign Up Demo):')
  console.log('  Phone:    9000000003 + Student ID: STU-0219 (Mohit Gurjar)')
  console.log('  OTP:      123456')
  console.log('======================================================\n')

  await disconnectDB()
}

// Auto-run if executed directly via CLI
if (process.argv[1]?.endsWith('index.js')) {
  const reset = process.argv.includes('--reset')
  runSeed({ reset }).catch((err) => {
    console.error('Seed execution error:', err)
    process.exit(1)
  })
}
