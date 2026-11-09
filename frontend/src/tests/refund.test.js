import { describe, it, expect } from 'vitest'
import { formatPaise, formatPercent, formatDate } from '../utils/format'

describe('Refund Breakdown Calculations & Formatting', () => {
  it('formats line-by-line itemized refund breakdown correctly', () => {
    const breakdown = {
      feeAfterDiscountPaise: 11000000, // ₹1,10,000
      paidPaise: 4000000,              // ₹40,000
      deductionPaise: 200000,          // ₹2,000 (5% cap 5k)
      daysElapsed: 73,
      totalCourseDays: 365,
      usedFraction: 0.2,               // 20%
      consumedPaise: 2200000,          // ₹22,000 (110000 * 0.2)
      gstOnRetainedPaise: 366102,      // 18% GST portion of retained amount
      refundPaise: 1600000,            // ₹16,000 (40000 - 22000 - 2000)
    }

    expect(formatPaise(breakdown.feeAfterDiscountPaise)).toBe('₹1,10,000')
    expect(formatPaise(breakdown.paidPaise)).toBe('₹40,000')
    expect(formatPaise(breakdown.deductionPaise)).toBe('₹2,000')
    expect(formatPercent(breakdown.usedFraction * 100)).toBe('20%')
    expect(formatPaise(breakdown.consumedPaise)).toBe('₹22,000')
    expect(formatPaise(breakdown.refundPaise)).toBe('₹16,000')
  })

  it('handles edge case when paid is less than non-refundable deduction', () => {
    const paidPaise = 150000 // ₹1,500
    const deductionPaise = 200000 // ₹2,000
    const netRefund = Math.max(0, paidPaise - deductionPaise)
    expect(netRefund).toBe(0)
    expect(formatPaise(netRefund)).toBe('₹0')
  })

  it('formats payout deadline date accurately', () => {
    const payoutDueBy = '2026-11-20T00:00:00.000Z'
    expect(formatDate(payoutDueBy, 'en')).toBe('20 Nov 2026')
    expect(formatDate(payoutDueBy, 'hi')).toBe('20 नवंबर 2026')
  })

  it('correctly resolves refund amount from both nested and flat API response shapes', () => {
    const nestedRes = {
      studentId: 'STU-0412',
      refundPaise: 4053400, // ₹40,534
      breakdown: {
        paidPaise: 6000000,
        consumedPaise: 1446600,
        deductionPaise: 500000,
      },
    }

    const flatRes = {
      studentId: 'STU-0412',
      refundAmountPaise: 4053400,
      finalRefundPaise: 4053400,
      amountPaidPaise: 6000000,
      consumedTuitionPaise: 1446600,
      deductionPaise: 500000,
    }

    const resolveRefund = (res) => res.refundPaise ?? res.finalRefundPaise ?? res.refundAmountPaise ?? 0
    const resolvePaid = (res) => res.breakdown?.paidPaise ?? res.amountPaidPaise ?? 0

    expect(resolveRefund(nestedRes)).toBe(4053400)
    expect(formatPaise(resolveRefund(nestedRes))).toBe('₹40,534')
    expect(resolvePaid(nestedRes)).toBe(6000000)

    expect(resolveRefund(flatRes)).toBe(4053400)
    expect(formatPaise(resolveRefund(flatRes))).toBe('₹40,534')
    expect(resolvePaid(flatRes)).toBe(6000000)
  })

  it('verifies early withdrawal gives positive refund whereas late withdrawal correctly caps at 0', () => {
    const courseFee = 12000000 // ₹1,20,000
    const totalDays = 365
    const deduction = 500000   // ₹5,000
    const paid = 6000000       // ₹60,000 paid (2 instalments)

    // Scenario A: Early withdrawal on day 45 (~12% attended)
    const elapsedEarly = 45
    const consumedEarly = Math.round(courseFee * (elapsedEarly / totalDays)) // 1479452 paise
    const refundEarly = Math.max(0, paid - deduction - consumedEarly) // 4020548 paise
    expect(refundEarly).toBeGreaterThan(0)
    expect(formatPaise(refundEarly)).toBe('₹40,205.48')

    // Scenario B: Late withdrawal on day 220 (~60% attended)
    const elapsedLate = 220
    const consumedLate = Math.round(courseFee * (elapsedLate / totalDays)) // ₹72,329
    const refundLate = Math.max(0, paid - deduction - consumedLate)
    expect(refundLate).toBe(0)
    expect(formatPaise(refundLate)).toBe('₹0')
  })
})
