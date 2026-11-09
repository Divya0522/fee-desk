import { useState, useEffect, useRef } from 'react'
import { AlertCircle, Loader2, RefreshCw, ArrowLeft } from 'lucide-react'
import { maskPhone } from '../../utils/validators'
import { getErrorMessage } from '../../utils/errorMap'
import { useLang } from '../../i18n/useLang'

export default function OtpInput({
  phone,
  onSubmit,
  onResend,
  onChangePhone,
  isLoading,
  serverError,
}) {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [now, setNow] = useState(() => Date.now())
  const [resendTime, setResendTime] = useState(() => Date.now() + 30 * 1000)
  const [sessionExpiresAt, setSessionExpiresAt] = useState(() => Date.now() + 300 * 1000)

  const inputRefs = useRef([])

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus({ preventScroll: true })
  }, [])

  // 1-second global ticker for countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const resendCooldown = Math.max(0, Math.ceil((resendTime - now) / 1000))
  const sessionTimer = Math.max(0, Math.ceil((sessionExpiresAt - now) / 1000))

  const lockCountdown = serverError?.lockedUntil
    ? Math.max(0, Math.ceil((serverError.lockedUntil - now) / 1000))
    : serverError?.retryAfterSec
    ? Math.max(0, serverError.retryAfterSec)
    : 0

  const handleDigitChange = (index, value) => {
    if (lockCountdown > 0) return

    // Allow only single numeric digit
    const cleaned = value.replace(/\D/g, '')

    if (!cleaned) {
      const next = [...digits]
      next[index] = ''
      setDigits(next)
      return
    }

    const digit = cleaned.slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)

    // Auto-advance to next input
    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus({ preventScroll: true })
    }

    // Auto-submit when all 6 digits are filled
    const allFilled = next.every((d) => d !== '')
    if (allFilled) {
      onSubmit(next.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        inputRefs.current[index - 1]?.focus({ preventScroll: true })
        const next = [...digits]
        next[index - 1] = ''
        setDigits(next)
      } else {
        const next = [...digits]
        next[index] = ''
        setDigits(next)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus({ preventScroll: true })
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus({ preventScroll: true })
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    if (lockCountdown > 0) return

    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const next = [...digits]
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || ''
    }
    setDigits(next)

    // Focus last filled box
    const lastFilledIndex = Math.min(pasted.length, 5)
    inputRefs.current[lastFilledIndex]?.focus({ preventScroll: true })

    if (pasted.length === 6) {
      onSubmit(pasted)
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (lockCountdown > 0 || sessionTimer <= 0) return
    const code = digits.join('')
    if (code.length === 6) {
      onSubmit(code)
    }
  }

  const handleResendClick = async () => {
    if (resendCooldown > 0 || lockCountdown > 0) return
    setDigits(['', '', '', '', '', ''])
    setResendTime(Date.now() + 30 * 1000)
    setSessionExpiresAt(Date.now() + 300 * 1000)
    await onResend()
    inputRefs.current[0]?.focus({ preventScroll: true })
  }

  const isComplete = digits.every((d) => d !== '')
  const isExpired = sessionTimer <= 0
  const isLocked = lockCountdown > 0

  return (
    <form className="auth-form" onSubmit={handleManualSubmit} noValidate>
      {/* Sent header with phone & change link */}
      <div className="otp-meta-box">
        <p className="otp-sent-text">
          {isHindi ? 'कोड भेजा गया:' : 'Code sent to'}{' '}
          <strong className="tabular">{maskPhone(phone)}</strong>
        </p>
        <button
          type="button"
          className="otp-change-btn"
          onClick={onChangePhone}
          disabled={isLoading}
        >
          <ArrowLeft size={13} aria-hidden="true" />
          <span>{isHindi ? 'नंबर बदलें' : 'Change number'}</span>
        </button>
      </div>

      {/* OTP Boxes Grid */}
      <div className="auth-field">
        <label className="auth-label" id="otp-label">
          {isHindi ? '6-अंकों का सत्यापन कोड' : '6-digit verification code'}
        </label>

        <div
          className="otp-grid flex items-center justify-center gap-2.5 w-full max-w-[340px] mx-auto"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            maxWidth: '340px',
            margin: '12px auto 16px',
            boxSizing: 'border-box',
          }}
          role="group"
          aria-labelledby="otp-label"
          onPaste={handlePaste}
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              className={`otp-box tabular ${digit ? 'filled' : ''} ${serverError ? 'box-error' : ''}`}
              style={{
                flex: '0 1 48px',
                width: '48px',
                maxWidth: '48px',
                minWidth: '0',
                height: '52px',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading || isLocked || isExpired}
              aria-label={`Digit ${index + 1}`}
              pattern="[0-9]*"
            />
          ))}
        </div>

        {/* Server Error or Lockout Message */}
        {serverError && !isLocked && !isExpired && (
          <div className="auth-error-msg" role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            <span>{getErrorMessage(serverError, isHindi ? 'hi' : 'en')}</span>
          </div>
        )}

        {/* Lockout Warning */}
        {isLocked && (
          <div className="auth-lock-banner" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <p>
              {isHindi
                ? `सुरक्षा लॉक: बहुत अधिक गलत प्रयास। कृपया ${Math.floor(lockCountdown / 60)}:${String(lockCountdown % 60).padStart(2, '0')} बाद पुनः प्रयास करें।`
                : `Account locked for 5 minutes. Try again in ${Math.floor(lockCountdown / 60)}:${String(lockCountdown % 60).padStart(2, '0')}.`}
            </p>
          </div>
        )}

        {/* Expiration Note */}
        {isExpired && !isLocked && (
          <div className="auth-expired-banner" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <p>{isHindi ? 'कोड समाप्त हो गया है। नया OTP भेजें।' : 'Code expired. Send a new one.'}</p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary auth-btn-submit"
        disabled={isLoading || !isComplete || isLocked || isExpired}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="spin-icon" aria-hidden="true" />
            <span>{isHindi ? 'सत्यापित हो रहा है...' : 'Verifying...'}</span>
          </>
        ) : (
          <span>{isHindi ? 'लॉगिन करें' : 'Verify & Continue'}</span>
        )}
      </button>

      {/* Resend Action & Expiry Countdown */}
      <div className="otp-footer-row">
        <button
          type="button"
          className="otp-resend-btn"
          onClick={handleResendClick}
          disabled={resendCooldown > 0 || isLoading || isLocked}
        >
          <RefreshCw size={13} aria-hidden="true" className={isLoading ? 'spin-icon' : ''} />
          {resendCooldown > 0 ? (
            <span>
              {isHindi ? `OTP पुनः भेजें (${resendCooldown}s)` : `Resend OTP in ${resendCooldown}s`}
            </span>
          ) : (
            <span>{isHindi ? 'OTP पुनः भेजें' : 'Resend OTP'}</span>
          )}
        </button>

        {!isExpired && (
          <span className="otp-expiry-timer tabular">
            {isHindi ? 'मान्यता:' : 'Expires in'} {Math.floor(sessionTimer / 60)}:
            {String(sessionTimer % 60).padStart(2, '0')}
          </span>
        )}
      </div>
    </form>
  )
}
