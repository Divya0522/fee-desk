import { errorResponse } from '../utils/response.js'

/**
 * Zod validation middleware for body, params, and query
 * Rejects unknown fields when strict validation is needed
 */
export function validate({ body, params, query } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        const strictBodySchema = body.strict ? body.strict() : body
        const parsedBody = strictBodySchema.parse(req.body)
        req.body = parsedBody
      }

      if (params) {
        const strictParamsSchema = params.strict ? params.strict() : params
        const parsedParams = strictParamsSchema.parse(req.params)
        req.params = parsedParams
      }

      if (query) {
        const strictQuerySchema = query.strict ? query.strict() : query
        const parsedQuery = strictQuerySchema.parse(req.query)
        req.query = parsedQuery
      }

      next()
    } catch (err) {
      if (err.errors) {
        const details = err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        }))
        return errorResponse(res, 'VALIDATION_ERROR', 'Input validation failed', details, 400)
      }
      next(err)
    }
  }
}
