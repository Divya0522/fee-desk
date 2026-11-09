/**
 * FeeDesk Staff (Accounts Executive) API Services
 * Real backend endpoint bindings with credentials: "include"
 */

import { apiClient } from './apiClient'

// --- DASHBOARD ---

export async function getDashboardSummary({ centre, batch } = {}) {
  const params = new URLSearchParams()
  if (centre && centre !== 'ALL') params.append('centre', centre)
  if (batch && batch !== 'ALL') params.append('batch', batch)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiClient.get(`/dashboard/summary${qs}`)
}

export async function getDashboardByCentre() {
  return apiClient.get('/dashboard/by-centre')
}

export async function getDashboardByBatch() {
  return apiClient.get('/dashboard/by-batch')
}

export async function getOverdueList({ minDays, centre, batch, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams()
  if (minDays !== undefined && minDays !== null) params.append('minDays', minDays)
  if (centre && centre !== 'ALL') params.append('centre', centre)
  if (batch && batch !== 'ALL') params.append('batch', batch)
  params.append('page', page)
  params.append('limit', limit)
  return apiClient.get(`/dashboard/overdue-list?${params.toString()}`)
}

export function getTallyExportUrl({ from, to } = {}) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  return `${base.replace(/\/+$/, '')}/dashboard/export/tally.csv?${params.toString()}`
}

export async function downloadTallyCsv({ from, to } = {}) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  const url = `${base.replace(/\/+$/, '')}/dashboard/export/tally.csv?${params.toString()}`

  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) {
    throw new Error(`Export failed with HTTP ${res.status}`)
  }
  const text = await res.text()
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  const fromClean = from ? from.replace(/[^0-9-]/g, '') : 'start'
  const toClean = to ? to.replace(/[^0-9-]/g, '') : 'today'
  a.download = `feedesk-tally-${fromClean}-${toClean}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(downloadUrl)

  const rows = text.trim().split(/\r?\n/).filter(Boolean)
  return { receiptCount: Math.max(0, rows.length - 1) }
}

// --- STUDENTS ---

export async function getStudents({ search, centre, batch, status, overdueOnly, page = 1, limit = 15 } = {}) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (centre && centre !== 'ALL') params.append('centre', centre)
  if (batch && batch !== 'ALL') params.append('batch', batch)
  if (status && status !== 'ALL') params.append('status', status)
  if (overdueOnly) params.append('overdueOnly', 'true')
  params.append('page', page)
  params.append('limit', limit)
  return apiClient.get(`/students?${params.toString()}`)
}

export async function getStudentDetail(studentId) {
  return apiClient.get(`/students/${encodeURIComponent(studentId)}`)
}

export async function recordStudentPayment(studentId, { instalmentId, amountPaise, method, gatewayRef, paidAt, idempotencyKey }) {
  return apiClient.post(`/students/${encodeURIComponent(studentId)}/payments`, {
    instalmentId,
    amountPaise,
    method,
    gatewayRef,
    paidAt,
    idempotencyKey,
  })
}

// --- REFUNDS ---

export async function calculateRefundPreview({ studentId, leaveDate }) {
  return apiClient.post('/refunds/calculate', { studentId, leaveDate })
}

export async function createRefundRequest({ studentId, leaveDate }) {
  return apiClient.post('/refunds', { studentId, leaveDate })
}

export async function getRefundsList({ status, centre } = {}) {
  const params = new URLSearchParams()
  if (status && status !== 'ALL') params.append('status', status)
  if (centre && centre !== 'ALL') params.append('centre', centre)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiClient.get(`/refunds${qs}`)
}

export async function approveRefund(id) {
  return apiClient.post(`/refunds/${id}/approve`, {})
}

export async function rejectRefund(id, { note } = {}) {
  return apiClient.post(`/refunds/${id}/reject`, { note })
}

export async function markRefundPaid(id) {
  return apiClient.post(`/refunds/${id}/mark-paid`, {})
}

// --- UNMATCHED PAYMENTS ---

export async function getUnmatchedPayments({ status = 'open' } = {}) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiClient.get(`/payments/unmatched${qs}`)
}

export async function matchUnmatchedPayment(id, { instalmentId }) {
  return apiClient.post(`/payments/unmatched/${id}/match`, { instalmentId })
}

export async function rejectUnmatchedPayment(id, { reason }) {
  return apiClient.post(`/payments/unmatched/${id}/reject`, { reason })
}

// --- RISK FLAGS ---

export async function getRiskFlags({ status, level, centre } = {}) {
  const params = new URLSearchParams()
  if (status && status !== 'ALL') params.append('status', status)
  if (level && level !== 'ALL') params.append('level', level)
  if (centre && centre !== 'ALL') params.append('centre', centre)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiClient.get(`/risk-flags${qs}`)
}

export async function markRiskFlagContacted(id, { note } = {}) {
  return apiClient.post(`/risk-flags/${id}/contacted`, { note })
}

export async function markRiskFlagFalse(id, { note }) {
  return apiClient.post(`/risk-flags/${id}/false-flag`, { note })
}

export async function resolveRiskFlag(id) {
  return apiClient.post(`/risk-flags/${id}/resolve`, {})
}

// --- REMINDERS & AUTOMATION ---

export async function getRemindersList({ status, centre } = {}) {
  const params = new URLSearchParams()
  if (status && status !== 'ALL') params.append('status', status)
  if (centre && centre !== 'ALL') params.append('centre', centre)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiClient.get(`/reminders${qs}`)
}

export async function runRemindersJob() {
  return apiClient.post('/admin/jobs/reminders/run', {})
}
