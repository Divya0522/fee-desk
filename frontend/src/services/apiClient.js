/**
 * FeeDesk API Client
 * Robust Fetch wrapper with credentials, timeout, JSON handling,
 * and unified ApiError normalization.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TIMEOUT_MS = 15000

export class ApiError extends Error {
  constructor(code, message, status = 400, retryAfterSec = null, details = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.retryAfterSec = retryAfterSec
    this.details = details
  }
}

// Session expired event listener hook
let onUnauthorizedCallback = null
export function setUnauthorizedHandler(fn) {
  onUnauthorizedCallback = fn
}

export async function request(endpoint, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  const url = `${BASE_URL.replace(/\/+$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  // Remove Content-Type if sending FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type']
  }

  const config = {
    method: options.method || 'GET',
    credentials: 'include',
    headers,
    signal: controller.signal,
    ...options,
  }

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body)
  }

  let res
  try {
    res = await fetch(url, config)
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new ApiError('OFFLINE', 'Request timed out after 15 seconds. Please try again.', 408)
    }
    throw new ApiError('OFFLINE', 'Network error. Please check your internet connection.', 0)
  } finally {
    clearTimeout(timeoutId)
  }

  // Parse JSON response safely
  let json = null
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      json = await res.json()
    } catch {
      json = null
    }
  }

  if (!res.ok) {
    const errorPayload = json?.error || {}
    const code = errorPayload.code || 'REQUEST_FAILED'
    const message = errorPayload.message || `Request failed with status ${res.status}`
    const retryAfterHeader = res.headers.get('Retry-After')
    const retryAfterSec =
      errorPayload.retryAfterSec ??
      errorPayload.details?.retryAfterSec ??
      (retryAfterHeader ? parseInt(retryAfterHeader, 10) : null)

    // On 401 from any call except /auth/me, clear session and redirect to /signin
    if (res.status === 401 && !endpoint.includes('/auth/me')) {
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback(message)
      } else {
        window.location.href = '/signin?expired=true'
      }
    }

    throw new ApiError(code, message, res.status, retryAfterSec, errorPayload.details)
  }

  return json?.data !== undefined ? json.data : json
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
}
