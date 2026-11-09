import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/**
 * Route protection by authentication state & role
 */
export function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#FAF8F4] flex flex-col items-center justify-center z-50 p-4" aria-live="polite">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2.5">
            <svg
              className="brand-monogram animate-pulse"
              viewBox="0 0 32 32"
              width="36"
              height="36"
              fill="none"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="8" fill="#0E4D44" />
              <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
              <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
              <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
              <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
            </svg>
            <span className="font-serif font-bold text-2xl tracking-tight text-[#14211F]">
              FeeDesk
            </span>
          </div>
          <div className="w-6 h-6 border-2 border-[#0E4D44] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Not logged in -> send to Sign In with return destination
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  // Unactivated parent -> redirect to activation flow
  if (role === 'parent' && user?.isActivated === false) {
    return <Navigate to="/signup" state={{ phone: user.phone, studentId: user.studentIds?.[0] }} replace />
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect user to their own authorized destination
    if (role === 'admin') {
      return <Navigate to="/admin" replace />
    }
    if (role === 'accounts' || role === 'centre_admin' || role === 'staff') {
      return <Navigate to="/accounts" replace />
    }
    return <Navigate to="/portal" replace />
  }

  return children
}

/**
 * For guest-only routes like /, /signin and /signup:
 * Redirects already authenticated users directly to their dashboard/portal
 * The landing page and sign-in pages are only accessible when NOT logged in.
 */
export function PublicOnlyRoute({ children }) {
  const { user, role, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#FAF8F4] flex flex-col items-center justify-center z-50 p-4" aria-live="polite">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2.5">
            <svg
              className="brand-monogram animate-pulse"
              viewBox="0 0 32 32"
              width="36"
              height="36"
              fill="none"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="8" fill="#0E4D44" />
              <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
              <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
              <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
              <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
            </svg>
            <span className="font-serif font-bold text-2xl tracking-tight text-[#14211F]">
              FeeDesk
            </span>
          </div>
          <div className="w-6 h-6 border-2 border-[#0E4D44] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (user) {
    if (role === 'admin') {
      return <Navigate to="/admin" replace />
    }
    if (role === 'accounts' || role === 'centre_admin' || role === 'staff') {
      return <Navigate to="/accounts" replace />
    }
    return <Navigate to="/portal" replace />
  }

  return children
}
