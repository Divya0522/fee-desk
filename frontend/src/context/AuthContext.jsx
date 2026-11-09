import { useState, useEffect, useCallback } from 'react'
import * as authApi from '../services/authApi'
import { setUnauthorizedHandler, setAuthToken } from '../services/apiClient'
import Toast from '../components/auth/Toast'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }) {
  // User state stored in-memory ONLY (no browser storage for tokens or auth data)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const closeToast = useCallback(() => {
    setToast(null)
  }, [])

  // Register automatic 401 unauthenticated redirect handler
  useEffect(() => {
    setUnauthorizedHandler((msg) => {
      setUser(null)
      showToast(msg || 'Session expired. Please sign in again.', 'error')
    })
  }, [showToast])

  // Restore session from httpOnly cookie on initial mount
  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      try {
        const res = await authApi.getMe()
        if (isMounted && res) {
          setUser(res.user || res)
        }
      } catch {
        // No active session or unauthenticated; silently initialize as guest
        if (isMounted) setUser(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    checkSession()
    return () => {
      isMounted = false
    }
  }, [])

  // Login parent with OTP
  const loginWithOtp = async (phone, otp) => {
    setIsLoading(true)
    try {
      const res = await authApi.verifyOtp({ phone, otp })
      const authenticatedUser = res.user || res
      if (res.token) setAuthToken(res.token)
      if (res.isActivated === false || authenticatedUser.isActivated === false) {
        // Unactivated parent: session cookie is withheld until statutory DPDP consent
        return { ...authenticatedUser, isActivated: false }
      }
      setUser(authenticatedUser)
      showToast('Successfully logged in!', 'success')
      return authenticatedUser
    } finally {
      setIsLoading(false)
    }
  }

  // Login staff with email + password
  const loginStaff = async (email, password) => {
    setIsLoading(true)
    try {
      const res = await authApi.staffLogin({ email, password })
      const authenticatedUser = res.user || res
      if (res.token) setAuthToken(res.token)
      setUser(authenticatedUser)
      showToast(`Welcome back, ${authenticatedUser.name}`, 'success')
      return authenticatedUser
    } finally {
      setIsLoading(false)
    }
  }

  // Activate parent account with DPDP consent
  const activate = async (activationData) => {
    setIsLoading(true)
    try {
      const res = await authApi.activateAccount(activationData)
      const authenticatedUser = res.user || res
      if (res.token) setAuthToken(res.token)
      setUser(authenticatedUser)
      showToast('Account activated! Welcome to FeeDesk.', 'success')
      return authenticatedUser
    } finally {
      setIsLoading(false)
    }
  }

  // Logout
  const logout = async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
    } catch {
      // Ignore network errors on logout
    } finally {
      setAuthToken(null)
      setUser(null)
      setIsLoading(false)
      showToast('You have been logged out.', 'info')
    }
  }

  const role = user?.role || null

  const value = {
    user,
    role,
    isLoading,
    loginWithOtp,
    loginStaff,
    activate,
    logout,
    showToast,
  }

  // Initial full-page loading skeleton while verifying httpOnly session cookie
  if (isLoading && !user) {
    return (
      <div className="fixed inset-0 bg-[#FAF8F4] flex flex-col items-center justify-center z-50 p-4" aria-busy="true" aria-label="Loading session">
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
          <p className="text-xs font-medium text-[#7A8582]">Verifying secure session...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Toast toast={toast} onClose={closeToast} />
    </AuthContext.Provider>
  )
}
