/**
 * FeeDesk Published Refund Policy — Single Source of Truth
 * Policy Version: v1.0
 * Effective Date: 2026-04-01
 */

export const REFUND_POLICY_CONFIG = {
  policyVersion: 'v1.0',
  effectiveFrom: '2026-04-01',
  deductionRatePercent: 5,
  deductionCapPaise: 500000, // ₹5,000 in integer paise
  fullRefundWindowDays: 0,   // Before day 0 (course start) = full tuition minus registration fee
  proRataBasis: 'calendar_days',
  payoutLimitDays: 10,
  gstRatePercent: 18,
  workedExample: {
    studentName: 'Aarav Sharma (Illustrative Example)',
    courseName: 'JEE 2-Year Classroom Program',
    courseFeePaise: 12000000, // ₹1,20,000
    paidPaise: 6000000,       // ₹60,000 paid to date
    totalCourseDays: 365,
    daysElapsed: 73,          // Exactly 20% of academic year
  },
}

/**
 * Pure calculator executing the published policy rules
 */
export function executeRefundCalculation({
  feeAfterDiscountPaise,
  paidPaise,
  totalCourseDays,
  daysElapsed,
  leaveDate,
  courseStart,
  courseEnd,
  config = REFUND_POLICY_CONFIG,
}) {
  const msPerDay = 1000 * 60 * 60 * 24
  const start = courseStart ? new Date(courseStart) : null
  const end = courseEnd ? new Date(courseEnd) : null
  const leave = leaveDate ? new Date(leaveDate) : null

  let warning = null
  let totalDays = totalCourseDays
  if ((!totalDays || totalDays <= 0) && start && end) {
    totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay))
  }
  totalDays = Math.max(1, totalDays || 365)

  let elapsed = daysElapsed
  if (elapsed === undefined && start && leave) {
    if (leave.getTime() < start.getTime()) {
      elapsed = 0
    } else {
      elapsed = Math.min(totalDays, Math.max(0, Math.round((leave.getTime() - start.getTime()) / msPerDay)))
    }
  }
  elapsed = Math.max(0, Math.min(totalDays, elapsed || 0))

  const fee = Math.max(0, feeAfterDiscountPaise || 0)
  const paid = Math.max(0, paidPaise || 0)

  // 1. Non-refundable deduction (e.g. 5% capped at ₹5,000)
  const rawDeduction = Math.round(fee * (config.deductionRatePercent / 100))
  const deductionPaise = Math.min(config.deductionCapPaise, rawDeduction)

  // 2. Consumed tuition fee pro-rata
  const usedRatio = elapsed / totalDays
  const usedPercent = `${Math.round(usedRatio * 100)}%`
  const consumedPaise = Math.round(fee * usedRatio)

  // 3. Edge cases and warnings
  if (paid <= 0) {
    warning = 'No fee payments found for this student. Calculated refund amount is ₹0.'
  } else if (start && leave && leave.getTime() < start.getTime()) {
    warning = 'Leave date is prior to course commencement. Full fees paid minus administrative deduction is refundable.'
  } else if (end && leave && leave.getTime() > end.getTime()) {
    warning = 'Leave date is after course completion date. 100% course period elapsed; refund is ₹0.'
  } else if (paid > 0 && paid <= deductionPaise + consumedPaise) {
    warning = `Total fee paid (₹${(paid / 100).toLocaleString('en-IN')}) does not exceed consumed tuition for ${elapsed} elapsed days (₹${(consumedPaise / 100).toLocaleString('en-IN')}) plus administrative retention (₹${(deductionPaise / 100).toLocaleString('en-IN')}). Under the published pro-rata policy, no refund is payable.`
  }

  // 3. Retained amount & GST component (18% inclusive)
  const retainedAmount = deductionPaise + consumedPaise
  const gstOnRetainedPaise = Math.max(0, Math.round(retainedAmount - retainedAmount / (1 + config.gstRatePercent / 100)))

  // 4. Final payable refund
  let refundPaise = 0
  if (end && leave && leave.getTime() > end.getTime()) {
    refundPaise = 0
  } else if (paid > 0) {
    refundPaise = Math.max(0, paid - deductionPaise - consumedPaise)
  }

  // 5. Payout due by date
  const payoutBase = leave || new Date()
  const payoutDueBy = new Date(payoutBase.getTime() + config.payoutLimitDays * msPerDay)

  return {
    policyVersion: config.policyVersion,
    effectiveFrom: config.effectiveFrom,
    warning,
    breakdown: {
      feeAfterDiscountPaise: fee,
      paidPaise: paid,
      deductionPaise,
      daysElapsed: elapsed,
      totalCourseDays: totalDays,
      usedPercent,
      consumedPaise,
      gstOnRetainedPaise,
    },
    refundPaise,
    payoutDueBy,
  }
}

/**
 * Generate localized policy summary & worked example from config
 */
export function getPublishedPolicySummary(config = REFUND_POLICY_CONFIG) {
  const deductionCapRupees = config.deductionCapPaise / 100

  // Execute worked example dynamically using same engine
  const sampleCalc = executeRefundCalculation({
    feeAfterDiscountPaise: config.workedExample.courseFeePaise,
    paidPaise: config.workedExample.paidPaise,
    totalCourseDays: config.workedExample.totalCourseDays,
    daysElapsed: config.workedExample.daysElapsed,
    config,
  })

  return {
    policyVersion: config.policyVersion,
    effectiveFrom: config.effectiveFrom,
    payoutLimitDays: config.payoutLimitDays,
    deductionRatePercent: config.deductionRatePercent,
    deductionCapPaise: config.deductionCapPaise,
    gstRatePercent: config.gstRatePercent,
    rules: [
      {
        id: 'registration_deduction',
        title: {
          en: 'Administrative Registration Fee',
          hi: 'प्रशासनिक पंजीकरण शुल्क',
        },
        description: {
          en: `A non-refundable deduction of ${config.deductionRatePercent}% of course tuition (capped at ₹${deductionCapRupees.toLocaleString('en-IN')}) is retained toward admission processing, study kit, and student LMS onboarding.`,
          hi: `कोर्स शुल्क का ${config.deductionRatePercent}% (अधिकतम ₹${deductionCapRupees.toLocaleString('en-IN')}) गैर-वापसी योग्य प्रशासनिक शुल्क के रूप में प्रवेश प्रक्रिया, अध्ययन सामग्री और LMS ऑनबोर्डिंग हेतु रखा जाता है।`,
        },
      },
      {
        id: 'pro_rata_consumption',
        title: {
          en: 'Daily Pro-Rata Tuition Consumption',
          hi: 'दैनिक अनुपात पर शिक्षण शुल्क कटौती',
        },
        description: {
          en: 'Tuition consumed is calculated strictly on elapsed calendar days: Consumed = (Days Elapsed ÷ Total Session Days) × Total Net Tuition Fee.',
          hi: 'उपभुक्त शिक्षण शुल्क की गणना बीते दिनों के सटीक अनुपात पर होती है: उपभुक्त शुल्क = (सत्र के बीते दिन ÷ कुल दिन) × शुद्ध शिक्षण शुल्क।',
        },
      },
      {
        id: 'payout_window',
        title: {
          en: 'Mandatory 10-Day Payout Guarantee',
          hi: '10-दिवसीय अनिवार्य भुगतान गारंटी',
        },
        description: {
          en: `All approved refund claims must be credited directly to the verified parent bank account within ${config.payoutLimitDays} calendar days of official withdrawal notice.`,
          hi: `सभी स्वीकृत रिफंड संस्थान छोड़ने की औपचारिक सूचना तिथि से ${config.payoutLimitDays} कैलेंडर दिनों के भीतर सीधे अभिभावक के सत्यापित बैंक खाते में जमा किए जाएंगे।`,
        },
      },
      {
        id: 'gst_treatment',
        title: {
          en: 'GST Treatment on Refunds',
          hi: 'जीएसटी (GST) नियम',
        },
        description: {
          en: `GST (${config.gstRatePercent}%) is legally applicable only to the retained tuition and non-refundable deduction portion. Unconsumed refunded tuition is returned without tax retention.`,
          hi: `जीएसटी (${config.gstRatePercent}%) केवल संस्थान द्वारा रखी गई राशि और प्रशासनिक शुल्क पर लागू है; अप्रयुक्त वापस की जाने वाली फीस पर कोई टैक्स कटौती नहीं होती।`,
        },
      },
      {
        id: 'pre_commencement',
        title: {
          en: 'Withdrawal Before Batch Start',
          hi: 'बैच शुरू होने से पूर्व निकासी',
        },
        description: {
          en: `If withdrawal occurs prior to the scheduled course start date, 100% of the tuition fee paid is refunded, retaining only the ₹${deductionCapRupees.toLocaleString('en-IN')} registration fee.`,
          hi: `यदि बैच प्रारंभ होने से पूर्व नाम वापस लिया जाता है, तो केवल ₹${deductionCapRupees.toLocaleString('en-IN')} प्रशासनिक शुल्क काटकर शेष 100% राशि वापस की जाएगी।`,
        },
      },
    ],
    workedExample: {
      scenario: {
        student: config.workedExample.studentName,
        course: config.workedExample.courseName,
        courseFeePaise: config.workedExample.courseFeePaise,
        paidPaise: config.workedExample.paidPaise,
        totalCourseDays: config.workedExample.totalCourseDays,
        daysElapsed: config.workedExample.daysElapsed,
        elapsedPercentage: `${Math.round((config.workedExample.daysElapsed / config.workedExample.totalCourseDays) * 100)}%`,
      },
      calculation: sampleCalc,
    },
  }
}
