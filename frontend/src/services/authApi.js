/**
 * FeeDesk Authentication API Service (Real Backend Layer)
 * Connects directly to Express backend using credentials: "include" (httpOnly JWT cookie).
 */

import { apiClient } from './apiClient'

/**
 * Lookup student by registered phone and student ID
 * Endpoint: POST /api/auth/lookup
 */
export async function lookupStudent(arg1, arg2) {
  const payload = typeof arg1 === 'object' && arg1 !== null ? arg1 : { phone: arg1, studentId: arg2 }
  return apiClient.post('/auth/lookup', {
    phone: String(payload.phone).replace(/\D/g, '').slice(-10),
    studentId: String(payload.studentId).trim().toUpperCase(),
  })
}

/**
 * Send 6-digit OTP to registered phone
 * Endpoint: POST /api/auth/otp/send
 */
export async function sendOtp(arg1) {
  const phone = typeof arg1 === 'object' && arg1 !== null ? arg1.phone : arg1
  return apiClient.post('/auth/otp/send', {
    phone: String(phone).replace(/\D/g, '').slice(-10),
  })
}

/**
 * Verify 6-digit OTP and establish session
 * Endpoint: POST /api/auth/otp/verify
 */
export async function verifyOtp(arg1, arg2) {
  const payload = typeof arg1 === 'object' && arg1 !== null ? arg1 : { phone: arg1, otp: arg2 }
  return apiClient.post('/auth/otp/verify', {
    phone: String(payload.phone).replace(/\D/g, '').slice(-10),
    otp: String(payload.otp).trim(),
  })
}

/**
 * Staff login with work email and password
 * Endpoint: POST /api/auth/staff/login
 */
export async function staffLogin(arg1, arg2) {
  const payload = typeof arg1 === 'object' && arg1 !== null ? arg1 : { email: arg1, password: arg2 }
  return apiClient.post('/auth/staff/login', {
    email: String(payload.email).trim().toLowerCase(),
    password: String(payload.password),
  })
}

/**
 * Activate parent account with DPDP Act 2023 parental consent
 * Endpoint: POST /api/auth/activate
 */
export async function activateAccount(activationData) {
  return apiClient.post('/auth/activate', {
    phone: String(activationData.phone).replace(/\D/g, '').slice(-10),
    studentId: String(activationData.studentId).trim().toUpperCase(),
    guardianName: String(activationData.guardianName || activationData.parentName).trim(),
    relationship: String(activationData.relationship).trim(),
    language: activationData.language || 'en',
    consent: Boolean(activationData.consent ?? activationData.consentGiven),
    reminderOptIn: Boolean(activationData.reminderOptIn ?? activationData.optInUpdates),
  })
}

/**
 * Invalidate session and clear auth cookie
 * Endpoint: POST /api/auth/logout
 */
export async function logout() {
  return apiClient.post('/auth/logout', {})
}

/**
 * Fetch authenticated user profile from session cookie
 * Endpoint: GET /api/auth/me
 */
export async function getMe() {
  return apiClient.get('/auth/me')
}

/**
 * Change password
 * Endpoint: POST /api/auth/change-password
 */
export async function changePassword({ currentPassword, newPassword }) {
  return apiClient.post('/auth/change-password', {
    currentPassword,
    newPassword,
  })
}
