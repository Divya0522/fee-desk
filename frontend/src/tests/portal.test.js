import { describe, it, expect, vi } from 'vitest'
import en from '../i18n/en'
import hi from '../i18n/hi'
import { formatPaise } from '../utils/format'

describe('Parent Portal Localisation Completeness', () => {
  it('ensures portal keys exist in both en.js and hi.js', () => {
    expect(en.portal).toBeDefined()
    expect(hi.portal).toBeDefined()

    expect(en.portal.nav).toBeDefined()
    expect(hi.portal.nav).toBeDefined()
    expect(Object.keys(en.portal.nav)).toEqual(Object.keys(hi.portal.nav))

    expect(en.portal.dues).toBeDefined()
    expect(hi.portal.dues).toBeDefined()
    expect(Object.keys(en.portal.dues)).toEqual(Object.keys(hi.portal.dues))

    expect(en.portal.receipts).toBeDefined()
    expect(hi.portal.receipts).toBeDefined()
    expect(Object.keys(en.portal.receipts)).toEqual(Object.keys(hi.portal.receipts))

    expect(en.portal.progress).toBeDefined()
    expect(hi.portal.progress).toBeDefined()
    expect(Object.keys(en.portal.progress)).toEqual(Object.keys(hi.portal.progress))

    expect(en.portal.paymentModal).toBeDefined()
    expect(hi.portal.paymentModal).toBeDefined()
    expect(Object.keys(en.portal.paymentModal)).toEqual(Object.keys(hi.portal.paymentModal))

    expect(en.portal.notifications).toBeDefined()
    expect(hi.portal.notifications).toBeDefined()
    expect(Object.keys(en.portal.notifications)).toEqual(Object.keys(hi.portal.notifications))

    expect(en.portal.support).toBeDefined()
    expect(hi.portal.support).toBeDefined()
    expect(Object.keys(en.portal.support)).toEqual(Object.keys(hi.portal.support))
  })
})

describe('Parent Portal Dues Calculation Logic', () => {
  it('correctly aggregates multiple overdue instalments', () => {
    const instalments = [
      { sequence: 1, amountPaise: 3000000, paidPaise: 3000000, balancePaise: 0, status: 'paid' },
      { sequence: 2, amountPaise: 3000000, paidPaise: 1500000, balancePaise: 1500000, status: 'overdue', daysOverdue: 26 },
      { sequence: 3, amountPaise: 3000000, paidPaise: 0, balancePaise: 3000000, status: 'overdue', daysOverdue: 5 },
      { sequence: 4, amountPaise: 3000000, paidPaise: 0, balancePaise: 3000000, status: 'upcoming', daysOverdue: 0 },
    ]

    const overdueList = instalments.filter((i) => i.status === 'overdue' && i.balancePaise > 0)
    const totalOverduePaise = overdueList.reduce((sum, i) => sum + i.balancePaise, 0)

    expect(overdueList.length).toBe(2)
    expect(totalOverduePaise).toBe(4500000)
    expect(formatPaise(totalOverduePaise)).toBe('₹45,000')

    const earliestUnpaid = instalments.find((i) => i.balancePaise > 0)
    expect(earliestUnpaid.sequence).toBe(2)
    expect(earliestUnpaid.balancePaise).toBe(1500000)
    expect(formatPaise(earliestUnpaid.balancePaise)).toBe('₹15,000')
  })

  it('handles all instalments paid state', () => {
    const instalments = [
      { sequence: 1, amountPaise: 3000000, paidPaise: 3000000, balancePaise: 0, status: 'paid' },
      { sequence: 2, amountPaise: 3000000, paidPaise: 3000000, balancePaise: 0, status: 'paid' },
    ]

    const unpaid = instalments.filter((i) => i.balancePaise > 0)
    expect(unpaid.length).toBe(0)
  })
})

describe('Tax Invoice GST Breakdown Math', () => {
  it('correctly splits 18% GST into integer CGST 9% and SGST 9%', () => {
    const amountPaise = 1500000 // ₹15,000
    const taxablePaise = Math.round(amountPaise / 1.18) // 1271186 -> ₹12,711.86
    const totalGstPaise = amountPaise - taxablePaise // 228814 -> ₹2,288.14
    const cgstPaise = Math.round(totalGstPaise / 2) // 114407
    const sgstPaise = totalGstPaise - cgstPaise // 114407

    expect(taxablePaise + cgstPaise + sgstPaise).toBe(amountPaise)
    expect(cgstPaise).toBe(sgstPaise)
    expect(formatPaise(amountPaise)).toBe('₹15,000')
  })
})

describe('Attendance Summary Math', () => {
  it('flags alert when absences in last 30 days exceeds 3', () => {
    const now = new Date()
    const records = [
      { date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), status: 'absent' },
      { date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), status: 'absent' },
      { date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000), status: 'absent' },
      { date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000), status: 'absent' },
      { date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), status: 'present' },
    ]

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recentAbsences = records.filter(
      (r) => r.status === 'absent' && new Date(r.date) >= thirtyDaysAgo
    ).length

    expect(recentAbsences).toBe(4)
    expect(recentAbsences > 3).toBe(true)
  })
})
