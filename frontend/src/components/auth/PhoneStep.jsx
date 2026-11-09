import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { cleanPhone, validatePhone } from '../../utils/validators'
import { getErrorMessage } from '../../utils/errorMap'
import { useLang } from '../../i18n/useLang'

export default function PhoneStep({ onSubmit, isLoading, serverError, initialPhone = '' }) {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [phone, setPhone] = useState(initialPhone)
  const [touched, setTouched] = useState(false)
  const [clientError, setClientError] = useState('')

  const handlePhoneChange = (e) => {
    const raw = e.target.value
    // Strip non-digits and limit to 10 digits
    const cleaned = raw.replace(/\D/g, '').slice(0, 10)
    setPhone(cleaned)
    if (touched) {
      if (!cleaned) {
        setClientError(isHindi ? 'कृपया मोबाइल नंबर दर्ज करें' : 'Mobile number is required')
      } else if (!validatePhone(cleaned)) {
        setClientError(
          isHindi
            ? 'मान्य 10 अंकों का नंबर दर्ज करें (6-9 से शुरू)'
            : 'Enter a valid 10-digit number starting with 6-9'
        )
      } else {
        setClientError('')
      }
    }
  }

  const handleBlur = () => {
    setTouched(true)
    if (!phone) {
      setClientError(isHindi ? 'कृपया मोबाइल नंबर दर्ज करें' : 'Mobile number is required')
    } else if (!validatePhone(phone)) {
      setClientError(
        isHindi
          ? 'मान्य 10 अंकों का नंबर दर्ज करें (6-9 से शुरू)'
          : 'Enter a valid 10-digit number starting with 6-9'
      )
    } else {
      setClientError('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    const cleaned = cleanPhone(phone)
    if (!validatePhone(cleaned)) {
      setClientError(
        isHindi
          ? 'मान्य 10 अंकों का नंबर दर्ज करें (6-9 से शुरू)'
          : 'Enter a valid 10-digit number starting with 6-9'
      )
      return
    }
    setClientError('')
    onSubmit(cleaned)
  }

  const activeError = clientError || getErrorMessage(serverError, isHindi ? 'hi' : 'en')

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {/* Field: Mobile Number */}
      <div className="auth-field">
        <label htmlFor="parent-phone" className="auth-label">
          {isHindi ? 'मोबाइल नंबर' : 'Mobile number'}
        </label>

        <div className={`auth-input-group ${activeError ? 'input-error' : ''}`}>
          <span className="auth-prefix" aria-hidden="true">
            <span className="flag-icon">🇮🇳</span> +91
          </span>
          <input
            id="parent-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="9876543210"
            className="auth-input with-prefix tabular"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={handleBlur}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={Boolean(activeError)}
            aria-describedby={activeError ? 'phone-error' : 'phone-helper'}
            autoFocus
          />
        </div>

        {/* Inline Error */}
        {activeError ? (
          <div id="phone-error" className="auth-error-msg" role="alert">
            <AlertCircle size={15} aria-hidden="true" />
            <span>
              {activeError}
              {(serverError?.code === 'NOT_ACTIVATED' || serverError?.code === 'UNACTIVATED_ACCOUNT') && (
                <>
                  {' '}
                  <Link to="/signup" className="auth-inline-link">
                    {isHindi ? 'खाता सक्रिय करें →' : 'Activate account →'}
                  </Link>
                </>
              )}
            </span>
          </div>
        ) : (
          <p id="phone-helper" className="auth-helper-text">
            {isHindi
              ? 'कोचिंग सेंटर पर पंजीकृत 10 अंकों का मोबाइल नंबर'
              : 'The 10-digit mobile number registered with your coaching centre'}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary auth-btn-submit"
        disabled={isLoading || (touched && Boolean(clientError))}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="spin-icon" aria-hidden="true" />
            <span>{isHindi ? 'OTP भेजा जा रहा है...' : 'Sending OTP...'}</span>
          </>
        ) : (
          <>
            <span>{isHindi ? 'OTP भेजें' : 'Send OTP'}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </button>

      {/* Footer Link */}
      <div className="auth-switch-box">
        <p>
          {isHindi ? 'पहली बार आए हैं?' : 'First time here?'}{' '}
          <Link to="/signup" className="auth-accent-link">
            {isHindi ? 'अपना खाता सक्रिय करें' : 'Activate your account'}
          </Link>
        </p>
      </div>
    </form>
  )
}
