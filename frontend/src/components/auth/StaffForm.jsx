import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Mail, Loader2, ShieldCheck } from 'lucide-react'
import { validateEmail, validatePassword } from '../../utils/validators'
import { getErrorMessage } from '../../utils/errorMap'
import { useLang } from '../../i18n/useLang'

export default function StaffForm({ onSubmit, isLoading, serverError }) {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const lockCountdown = serverError?.lockedUntil
    ? Math.max(0, Math.ceil((serverError.lockedUntil - now) / 1000))
    : serverError?.retryAfterSec
    ? Math.max(0, serverError.retryAfterSec)
    : 0

  const validateField = (name, value) => {
    if (name === 'email') {
      if (!value) return isHindi ? 'ईमेल आवश्यक है' : 'Email address is required'
      if (!validateEmail(value)) return isHindi ? 'मान्य ईमेल दर्ज करें' : 'Enter a valid email address'
    }
    if (name === 'password') {
      if (!value) return isHindi ? 'पासवर्ड आवश्यक है' : 'Password is required'
      if (!validatePassword(value)) return isHindi ? 'कम से कम 6 अक्षर आवश्यक' : 'Must be at least 6 characters'
    }
    return ''
  }

  const handleChange = (name, value) => {
    if (name === 'email') setEmail(value)
    if (name === 'password') setPassword(value)

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
    }
  }

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const val = name === 'email' ? email : password
    setErrors((prev) => ({ ...prev, [name]: validateField(name, val) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (lockCountdown > 0) return

    const emailErr = validateField('email', email)
    const passErr = validateField('password', password)
    setTouched({ email: true, password: true })
    setErrors({ email: emailErr, password: passErr })

    if (emailErr || passErr) return

    onSubmit({ email: email.trim(), password })
  }

  const isLocked = lockCountdown > 0

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {/* Field: Staff Email */}
      <div className="auth-field">
        <label htmlFor="staff-email" className="auth-label">
          {isHindi ? 'कार्यकारी ईमेल' : 'Work email'}
        </label>

        <div className={`auth-input-wrap ${errors.email ? 'input-error' : ''}`}>
          <Mail size={16} className="auth-field-icon" aria-hidden="true" />
          <input
            id="staff-email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="name@centre.com"
            className="auth-input with-icon"
            value={email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            disabled={isLoading || isLocked}
            aria-required="true"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </div>

        {errors.email && (
          <div id="email-error" className="auth-error-msg" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{errors.email}</span>
          </div>
        )}
      </div>

      {/* Field: Password */}
      <div className="auth-field">
        <div className="auth-label-row">
          <label htmlFor="staff-password" className="auth-label">
            {isHindi ? 'पासवर्ड' : 'Password'}
          </label>
          <Link to="/forgot-password" className="auth-forgot-link">
            {isHindi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
          </Link>
        </div>

        <div className={`auth-input-wrap ${errors.password ? 'input-error' : ''}`}>
          <Lock size={16} className="auth-field-icon" aria-hidden="true" />
          <input
            id="staff-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="auth-input with-icon with-action"
            value={password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            disabled={isLoading || isLocked}
            aria-required="true"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            className="auth-password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {errors.password && (
          <div id="password-error" className="auth-error-msg" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{errors.password}</span>
          </div>
        )}
      </div>

      {/* Server Error Message */}
      {serverError && !isLocked && (
        <div className="auth-error-msg" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{getErrorMessage(serverError, isHindi ? 'hi' : 'en')}</span>
        </div>
      )}

      {/* Lockout Banner */}
      {isLocked && (
        <div className="auth-lock-banner" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <p>
            {isHindi
              ? `सुरक्षा लॉक: 5 विफल प्रयासों के बाद फॉर्म 5 मिनट के लिए लॉक है (${Math.floor(lockCountdown / 60)}:${String(lockCountdown % 60).padStart(2, '0')})।`
              : `Account locked for 5 minutes after multiple failed attempts (${Math.floor(lockCountdown / 60)}:${String(lockCountdown % 60).padStart(2, '0')}).`}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary auth-btn-submit"
        disabled={isLoading || isLocked}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="spin-icon" aria-hidden="true" />
            <span>{isHindi ? 'लॉगिन हो रहा है...' : 'Signing in...'}</span>
          </>
        ) : (
          <span>{isHindi ? 'साइन इन करें' : 'Sign in as Staff'}</span>
        )}
      </button>

      {/* Admin Note */}
      <div className="auth-admin-note">
        <ShieldCheck size={14} aria-hidden="true" />
        <span>
          {isHindi
            ? 'स्टाफ खाते आपके कोचिंग सेंटर एडमिन द्वारा बनाए जाते हैं।'
            : 'Staff accounts are created by your centre admin.'}
        </span>
      </div>
    </form>
  )
}
