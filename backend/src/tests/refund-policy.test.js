import request from 'supertest'
import { app } from '../app.js'
import {
  REFUND_POLICY_CONFIG,
  executeRefundCalculation,
  getPublishedPolicySummary,
} from '../config/refundPolicy.js'

describe('Single Source of Truth: Refund Policy & Calculator Verification', () => {
  test('1. GET /api/policy/refund is public and returns policy rules with worked example', async () => {
    const res = await request(app).get('/api/policy/refund')

    expect(res.status).toBe(200)
    expect(res.body.data.policyVersion).toBe('v1.0')
    expect(res.body.data.effectiveFrom).toBe('2026-04-01')
    expect(res.body.data.payoutLimitDays).toBe(10)
    expect(res.body.data.rules).toBeInstanceOf(Array)
    expect(res.body.data.rules.length).toBeGreaterThanOrEqual(4)

    // Check localized descriptions
    const regRule = res.body.data.rules.find((r) => r.id === 'registration_deduction')
    expect(regRule.description.en).toContain('5%')
    expect(regRule.description.en).toContain('₹5,000')
    expect(regRule.description.hi).toContain('5%')
    expect(regRule.description.hi).toContain('₹5,000')

    // Check worked example
    expect(res.body.data.workedExample).toBeDefined()
    expect(res.body.data.workedExample.calculation.breakdown.paidPaise).toBe(6000000)
    expect(res.body.data.workedExample.calculation.refundPaise).toBeGreaterThan(0)
  })

  test('2. Changing config numbers dynamically alters BOTH the published text AND calculator results', () => {
    // Custom policy variation
    const customConfig = {
      ...REFUND_POLICY_CONFIG,
      policyVersion: 'v2.0-test',
      deductionRatePercent: 8,
      deductionCapPaise: 800000, // ₹8,000
      payoutLimitDays: 7,
      workedExample: {
        ...REFUND_POLICY_CONFIG.workedExample,
        courseFeePaise: 10000000, // ₹1,00,000
        paidPaise: 5000000,       // ₹50,000
        totalCourseDays: 200,
        daysElapsed: 20,          // 10%
      },
    }

    const summary = getPublishedPolicySummary(customConfig)
    const calculation = executeRefundCalculation({
      feeAfterDiscountPaise: customConfig.workedExample.courseFeePaise,
      paidPaise: customConfig.workedExample.paidPaise,
      totalCourseDays: customConfig.workedExample.totalCourseDays,
      daysElapsed: customConfig.workedExample.daysElapsed,
      config: customConfig,
    })

    // Verify published text reflects new numbers
    const regRule = summary.rules.find((r) => r.id === 'registration_deduction')
    expect(regRule.description.en).toContain('8%')
    expect(regRule.description.en).toContain('₹8,000')
    expect(regRule.description.hi).toContain('8%')
    expect(regRule.description.hi).toContain('₹8,000')

    const payoutRule = summary.rules.find((r) => r.id === 'payout_window')
    expect(payoutRule.description.en).toContain('7 calendar days')
    expect(payoutRule.description.hi).toContain('7 कैलेंडर दिनों')

    // Verify calculator output reflects custom deduction and payout window
    expect(calculation.breakdown.deductionPaise).toBe(800000) // 8% of 1,00,000 = 8,000
    expect(calculation.breakdown.consumedPaise).toBe(1000000)  // 10% of 1,00,000 = 10,000
    // Net refund: 50,000 - 8,000 - 10,000 = 32,000 (3200000 paise)
    expect(calculation.refundPaise).toBe(3200000)
    expect(summary.workedExample.calculation.refundPaise).toBe(3200000)
  })
})
