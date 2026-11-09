import { apiClient } from './apiClient'

export async function getRefundPolicy() {
  return apiClient.get('/policy/refund')
}
