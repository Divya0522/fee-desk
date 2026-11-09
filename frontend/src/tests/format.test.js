import { describe, it, expect } from 'vitest'
import {
  formatPaise,
  formatPaiseCompact,
  maskPhone,
  formatDate,
  formatDaysOverdue,
  getAgeingBucketLabel,
  formatPercent,
  formatReminderOffset,
} from '../utils/format'

describe('formatPaise', () => {
  it('formats whole rupee paise with Indian number system', () => {
    expect(formatPaise(1500000)).toBe('₹15,000')
    expect(formatPaise(12000000)).toBe('₹1,20,000')
    expect(formatPaise(3000000)).toBe('₹30,000')
    expect(formatPaise(0)).toBe('₹0')
  })

  it('formats fractional paise without float math anomalies', () => {
    expect(formatPaise(1500050)).toBe('₹15,000.50')
    expect(formatPaise(1500005)).toBe('₹15,000.05')
  })

  it('handles negative or invalid values gracefully', () => {
    expect(formatPaise(-1500000)).toBe('-₹15,000')
    expect(formatPaise(null)).toBe('₹0')
    expect(formatPaise(undefined)).toBe('₹0')
  })
})

describe('formatPaiseCompact', () => {
  it('formats amounts in lakhs (₹1.2L) and crores (₹3.1Cr)', () => {
    expect(formatPaiseCompact(12000000)).toBe('₹1.2L')
    expect(formatPaiseCompact(3100000000)).toBe('₹3.1Cr')
    expect(formatPaiseCompact(5000000)).toBe('₹50,000')
    expect(formatPaiseCompact(0)).toBe('₹0')
  })
})

describe('maskPhone', () => {
  it('masks a standard 10-digit Indian phone number', () => {
    expect(maskPhone('9829012345')).toBe('+91 98xxxxx345')
    expect(maskPhone('+919829012345')).toBe('+91 98xxxxx345')
    expect(maskPhone('')).toBe('—')
  })
})

describe('formatReminderOffset', () => {
  it('correctly maps offset keys to readable strings in English', () => {
    expect(formatReminderOffset({ offsetKey: '-7' }, 'en')).toBe('7 days before due')
    expect(formatReminderOffset({ offsetKey: '3_days_before' }, 'en')).toBe('3 days before due')
    expect(formatReminderOffset({ offsetKey: '0' }, 'en')).toBe('On due date')
    expect(formatReminderOffset({ offsetKey: '3_days_after' }, 'en')).toBe('3 days overdue')
    expect(formatReminderOffset({ offsetKey: '+3' }, 'en')).toBe('3 days overdue')
    expect(formatReminderOffset({ offsetKey: '15_days_after' }, 'en')).toBe('15 days overdue')
  })

  it('correctly maps offset keys in Hindi', () => {
    expect(formatReminderOffset({ offsetKey: '-7' }, 'hi')).toBe('7 दिन पहले')
    expect(formatReminderOffset({ offsetKey: '0' }, 'hi')).toBe('देय तिथि पर')
    expect(formatReminderOffset({ offsetKey: '+3' }, 'hi')).toBe('3 दिन अतिदेय')
  })
})

describe('formatDate', () => {
  it('formats dates in English (e.g. 10 Oct 2026)', () => {
    const d = new Date('2026-10-10T00:00:00.000Z')
    expect(formatDate(d, 'en')).toBe('10 Oct 2026')
  })

  it('formats dates in Hindi with Devanagari month names', () => {
    const d = new Date('2026-10-10T00:00:00.000Z')
    expect(formatDate(d, 'hi')).toBe('10 अक्टूबर 2026')
  })

  it('handles invalid dates gracefully', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('invalid-date')).toBe('—')
  })
})

describe('getAgeingBucketLabel', () => {
  it('returns readable English labels', () => {
    expect(getAgeingBucketLabel('current', 'en')).toBe('Current (Not due)')
    expect(getAgeingBucketLabel('1_30', 'en')).toBe('1–30 days')
    expect(getAgeingBucketLabel('31_60', 'en')).toBe('31–60 days')
    expect(getAgeingBucketLabel('61_90', 'en')).toBe('61–90 days')
    expect(getAgeingBucketLabel('90_plus', 'en')).toBe('90+ days')
  })

  it('returns readable Hindi labels', () => {
    expect(getAgeingBucketLabel('current', 'hi')).toBe('वर्तमान (देय नहीं)')
    expect(getAgeingBucketLabel('1_30', 'hi')).toBe('1–30 दिन')
    expect(getAgeingBucketLabel('31_60', 'hi')).toBe('31–60 दिन')
  })
})

describe('formatDaysOverdue and formatPercent', () => {
  it('formats overdue days with zero threshold', () => {
    expect(formatDaysOverdue(0, 'en')).toBe('On track')
    expect(formatDaysOverdue(23, 'en')).toBe('23 days overdue')
    expect(formatDaysOverdue(23, 'hi')).toBe('23 दिन अतिदेय')
  })

  it('formats percentages cleanly', () => {
    expect(formatPercent(74.24)).toBe('74.2%')
    expect(formatPercent(100.0)).toBe('100%')
  })
})
