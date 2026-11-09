import { errorResponse } from '../utils/response.js'

export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', details = undefined) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function errorHandler(err, req, res, next) {
  // If response has already started streaming
  if (res.headersSent) {
    return next(err)
  }

  // App custom error
  if (err instanceof AppError) {
    return errorResponse(res, err.code, err.message, err.details, err.statusCode)
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {})
    return errorResponse(
      res,
      'DUPLICATE_ENTRY',
      `Duplicate value for field: ${fields.join(', ')}`,
      err.keyValue,
      409
    )
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, 'INVALID_ID', `Invalid identifier format for ${err.path}`, null, 400)
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }))
    return errorResponse(res, 'VALIDATION_ERROR', 'Model validation failed', details, 422)
  }

  // Default internal server error
  console.error('Unhandled server error:', err)
  return errorResponse(
    res,
    'INTERNAL_SERVER_ERROR',
    process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message,
    null,
    500
  )
}
