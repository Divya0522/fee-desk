/**
 * Pure validation & formatting utilities for FeeDesk auth
 */

/**
 * Validates Indian 10-digit mobile number starting with 6, 7, 8, or 9
 */
export function validatePhone(phone) {
  if (!phone) return false
  const cleaned = String(phone).replace(/\D/g, '')
  return /^[6-9]\d{9}$/.test(cleaned)
}

/**
 * Normalizes a phone number to 10 digits
 */
export function cleanPhone(phone) {
  if (!phone) return ''
  return String(phone).replace(/\D/g, '').slice(-10)
}

/**
 * Validates student ID format (e.g. STU-0412, STU-0587, STU-0219)
 */
export function validateStudentId(studentId) {
  if (!studentId) return false
  const trimmed = String(studentId).trim().toUpperCase()
  return /^STU-\d{3,6}$/i.test(trimmed) || /^[A-Z0-9-]{4,12}$/i.test(trimmed)
}

/**
 * Validates email address format
 */
export function validateEmail(email) {
  if (!email) return false
  const trimmed = String(email).trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

/**
 * Validates password (minimum 6 characters)
 */
export function validatePassword(password) {
  if (!password) return false
  return String(password).length >= 6
}

/**
 * Validates full name (min 2 characters, letters & spaces)
 */
export function validateName(name) {
  if (!name) return false
  return String(name).trim().length >= 2
}

/**
 * Validates 6-digit OTP
 */
export function validateOtp(otp) {
  if (!otp) return false
  return /^\d{6}$/.test(String(otp).trim())
}

/**
 * Masks a 10-digit mobile number for privacy (e.g. "+91 90xxxxx001")
 */
export function maskPhone(phone) {
  const cleaned = cleanPhone(phone)
  if (cleaned.length !== 10) return phone || ''
  return `+91 ${cleaned.slice(0, 2)}xxxxx${cleaned.slice(-3)}`
}
