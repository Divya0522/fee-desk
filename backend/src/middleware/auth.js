import { verifyToken } from '../services/tokenService.js'
import { User } from '../models/User.js'
import { AppError } from './errorHandler.js'

export async function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      req.headers?.authorization?.replace(/^Bearer\s+/i, '')

    if (!token) {
      throw new AppError('Authentication required. Please sign in.', 401, 'UNAUTHORIZED')
    }

    const decoded = verifyToken(token)
    const user = await User.findById(decoded.id).lean()

    if (!user || user.isActive === false) {
      throw new AppError('User account not found.', 401, 'UNAUTHORIZED')
    }

    // Attach user to request
    req.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
      centre: user.centre,
      language: user.language,
      studentIds: user.studentIds || [],
      isActivated: user.isActivated,
      isActive: user.isActive !== false,
      mustChangePassword: !!user.mustChangePassword,
    }

    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired session. Please sign in again.', 401, 'UNAUTHORIZED'))
    }
    next(err)
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'))
    }

    // Admin has access to all staff roles
    const userRole = req.user.role
    if (!roles.includes(userRole) && !(roles.includes('accounts') && (userRole === 'admin' || userRole === 'centre_admin'))) {
      return next(new AppError('You do not have permission to access this resource.', 403, 'FORBIDDEN'))
    }

    next()
  }
}

export function requireStudentAccess(req, res, next) {
  const studentId = req.params.studentId

  // Accounts/staff have access to all students
  if (req.user.role === 'accounts' || req.user.role === 'centre_admin' || req.user.role === 'admin') {
    return next()
  }

  // Parent object-level access check
  if (req.user.role === 'parent') {
    if (!req.user.studentIds || !req.user.studentIds.includes(studentId)) {
      // Return 404 (not 403) to prevent enumerating students
      return next(new AppError('Student record not found.', 404, 'NOT_FOUND'))
    }
  }

  next()
}
