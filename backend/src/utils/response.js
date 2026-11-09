/**
 * Standard API response formatters
 */

export function successResponse(res, data, meta = undefined, statusCode = 200) {
  const payload = { data }
  if (meta !== undefined) {
    payload.meta = meta
  }
  return res.status(statusCode).json(payload)
}

export function errorResponse(res, code, message, details = undefined, statusCode = 400) {
  const payload = {
    error: {
      code,
      message,
    },
  }
  if (details !== undefined) {
    payload.error.details = details
  }
  return res.status(statusCode).json(payload)
}
