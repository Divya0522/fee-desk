/**
 * FeeDesk Parent Portal API Service
 * Interacts with backend parent controller and mock checkout endpoints.
 */

import { apiClient } from './apiClient'

export async function getParentStudents() {
  return apiClient.get('/parent/students')
}

export async function getStudentLedger(studentId) {
  const cleanId = String(studentId).trim().toUpperCase()
  return apiClient.get(`/parent/students/${cleanId}/ledger`)
}

export async function getStudentReceipts(studentId) {
  const cleanId = String(studentId).trim().toUpperCase()
  return apiClient.get(`/parent/students/${cleanId}/receipts`)
}

export async function getStudentAttendance(studentId) {
  const cleanId = String(studentId).trim().toUpperCase()
  return apiClient.get(`/parent/students/${cleanId}/attendance`)
}

export async function getStudentScores(studentId) {
  const cleanId = String(studentId).trim().toUpperCase()
  return apiClient.get(`/parent/students/${cleanId}/scores`)
}

export async function getStudentReminders(studentId) {
  const cleanId = String(studentId).trim().toUpperCase()
  return apiClient.get(`/parent/students/${cleanId}/reminders`)
}

export async function createInstalmentPayLink(instalmentId) {
  return apiClient.post(`/parent/instalments/${instalmentId}/pay-link`, {})
}

export async function mockCheckout(token, method = 'upi') {
  return apiClient.post(`/payments/mock-checkout/${token}`, { method })
}
