/**
 * Central async wrapper to forward errors to Express errorHandler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
