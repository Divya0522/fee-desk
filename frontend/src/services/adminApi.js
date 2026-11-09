import { apiClient } from './apiClient'

export const adminApi = {
  getOverview() {
    return apiClient.get('/admin/overview')
  },

  getStaff(params = {}) {
    const q = new URLSearchParams()
    if (params.search) q.append('search', params.search)
    if (params.role && params.role !== 'ALL') q.append('role', params.role)
    if (params.active !== undefined && params.active !== 'ALL') q.append('active', params.active)
    if (params.page) q.append('page', params.page)
    if (params.limit) q.append('limit', params.limit)
    return apiClient.get(`/admin/staff?${q.toString()}`)
  },

  createStaff(payload) {
    return apiClient.post('/admin/staff', payload)
  },

  updateStaff(id, payload) {
    return apiClient.patch(`/admin/staff/${id}`, payload)
  },

  resetStaffPassword(id) {
    return apiClient.post(`/admin/staff/${id}/reset-password`, {})
  },

  getAuditLogs(params = {}) {
    const q = new URLSearchParams()
    if (params.actor) q.append('actor', params.actor)
    if (params.action && params.action !== 'ALL') q.append('action', params.action)
    if (params.entity && params.entity !== 'ALL') q.append('entity', params.entity)
    if (params.from) q.append('from', params.from)
    if (params.to) q.append('to', params.to)
    if (params.page) q.append('page', params.page)
    if (params.limit) q.append('limit', params.limit)
    return apiClient.get(`/admin/audit-logs?${q.toString()}`)
  },

  getJobs() {
    return apiClient.get('/admin/jobs')
  },

  runJob(name) {
    return apiClient.post(`/admin/jobs/${name}/run`, {})
  },

  getSettings() {
    return apiClient.get('/admin/settings')
  },
}
