/**
 * FeeDesk Formatting Utilities
 * Handles Integer Paise, Indian Rupee localization, Hindi/English dates,
 * and Ageing bucket labels. Never performs float maths on money.
 */

const HINDI_MONTHS = [
  'जनवरी',
  'फ़रवरी',
  'मार्च',
  'अप्रैल',
  'मई',
  'जून',
  'जुलाई',
  'अगस्त',
  'सितंबर',
  'अक्टूबर',
  'नवंबर',
  'दिसंबर',
]

const EN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Formats integer paise into localized Indian currency string (e.g. ₹1,20,000 or ₹1,20,000.50)
 * Uses integer division and modulo to avoid floating point precision errors.
 */
export function formatPaise(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) return '₹0'
  const isNegative = paise < 0
  const absPaise = Math.abs(Math.round(paise))

  const rupees = Math.floor(absPaise / 100)
  const cents = absPaise % 100

  const formattedRupees = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(rupees)

  const sign = isNegative ? '-' : ''
  if (cents > 0) {
    return `${sign}₹${formattedRupees}.${String(cents).padStart(2, '0')}`
  }
  return `${sign}₹${formattedRupees}`
}

/**
 * Formats large amounts in compact Indian notation for KPI cards (e.g. ₹1.2L, ₹3.1Cr).
 * Smaller amounts (< ₹1 Lakh) fall back to formatPaise.
 */
export function formatPaiseCompact(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) return '₹0'
  const isNegative = paise < 0
  const absPaise = Math.abs(Math.round(paise))
  const rupees = Math.floor(absPaise / 100)

  const sign = isNegative ? '-' : ''

  // 1 Crore = 1,00,00,000 rupees
  if (rupees >= 10000000) {
    const cr = (rupees / 10000000).toFixed(1).replace(/\.0$/, '')
    return `${sign}₹${cr}Cr`
  }

  // 1 Lakh = 1,00,000 rupees
  if (rupees >= 100000) {
    const lk = (rupees / 100000).toFixed(1).replace(/\.0$/, '')
    return `${sign}₹${lk}L`
  }

  return formatPaise(paise)
}

/**
 * Masks a 10-digit Indian mobile number: +91 98xxxxx001 or 98xxxxx001
 */
export function maskPhone(phone) {
  if (!phone) return '—'
  const clean = String(phone).replace(/\D/g, '').slice(-10)
  if (clean.length < 10) return phone
  return `+91 ${clean.slice(0, 2)}xxxxx${clean.slice(-3)}`
}

/**
 * Formats a Date object or ISO string into "10 Oct 2026" (en) or "10 अक्टूबर 2026" (hi)
 */
export function formatDate(dateInput, lang = 'en') {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '—'

  const day = date.getDate()
  const monthIdx = date.getMonth()
  const year = date.getFullYear()

  if (lang === 'hi') {
    return `${day} ${HINDI_MONTHS[monthIdx]} ${year}`
  }
  return `${day} ${EN_MONTHS[monthIdx]} ${year}`
}

/**
 * Formats days overdue with semantic label
 */
export function formatDaysOverdue(days, lang = 'en') {
  const isHindi = lang === 'hi'
  const numDays = Math.max(0, Number(days) || 0)

  if (numDays === 0) {
    return isHindi ? 'समय पर' : 'On track'
  }
  return isHindi ? `${numDays} दिन अतिदेय` : `${numDays} days overdue`
}

/**
 * Human-readable label for Ageing buckets
 */
export function getAgeingBucketLabel(bucketKey, lang = 'en') {
  const isHindi = lang === 'hi'
  switch (bucketKey) {
    case 'current':
    case '0':
      return isHindi ? 'वर्तमान (देय नहीं)' : 'Current (Not due)'
    case '1_30':
    case '1-30':
      return isHindi ? '1–30 दिन' : '1–30 days'
    case '31_60':
    case '31-60':
      return isHindi ? '31–60 दिन' : '31–60 days'
    case '61_90':
    case '61-90':
      return isHindi ? '61–90 दिन' : '61–90 days'
    case '90_plus':
    case '90+':
      return isHindi ? '90+ दिन' : '90+ days'
    default:
      return bucketKey
  }
}

/**
 * Format percentages (e.g. 74.2% or 74%)
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '0%'
  const num = Number(value)
  return `${num.toFixed(decimals).replace(/\.0$/, '')}%`
}

/**
 * Formats reminder offset from either offsetKey ('-7', '+3', '3_days_before', etc.)
 * or offsetDays integer.
 */
export function formatReminderOffset(item, lang = 'en') {
  const isHindi = lang === 'hi'
  if (!item) return isHindi ? 'देय तिथि पर' : 'On due date'

  const rawKey = String(
    typeof item === 'object' ? item.offsetKey ?? item.offsetDays ?? '' : item
  )
    .trim()
    .toLowerCase()

  if (rawKey === '-7' || rawKey === '7_days_before') {
    return isHindi ? '7 दिन पहले' : '7 days before due'
  }
  if (rawKey === '-3' || rawKey === '3_days_before') {
    return isHindi ? '3 दिन पहले' : '3 days before due'
  }
  if (rawKey === '0' || rawKey === 'on_due_date') {
    return isHindi ? 'देय तिथि पर' : 'On due date'
  }
  if (rawKey === '+3' || rawKey === '3' || rawKey === '3_days_after') {
    return isHindi ? '3 दिन अतिदेय' : '3 days overdue'
  }
  if (rawKey === '+7' || rawKey === '7' || rawKey === '7_days_after') {
    return isHindi ? '7 दिन अतिदेय' : '7 days overdue'
  }
  if (rawKey === '+15' || rawKey === '15' || rawKey === '15_days_after') {
    return isHindi ? '15 दिन अतिदेय' : '15 days overdue'
  }

  const num = parseInt(rawKey, 10)
  if (!isNaN(num)) {
    if (num < 0) {
      return isHindi ? `${Math.abs(num)} दिन पहले` : `${Math.abs(num)} days before due`
    }
    if (num === 0) {
      return isHindi ? 'देय तिथि पर' : 'On due date'
    }
    return isHindi ? `${num} दिन अतिदेय` : `${num} days overdue`
  }

  return rawKey.replace(/_/g, ' ') || (isHindi ? 'देय तिथि पर' : 'On due date')
}
