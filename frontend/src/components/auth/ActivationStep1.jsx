import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Loader2, UserCheck } from 'lucide-react'
import { cleanPhone, validatePhone, validateStudentId } from '../../utils/validators'
import { getErrorMessage } from '../../utils/errorMap'
import { useLang } from '../../i18n/useLang'

export default function ActivationStep1({
  onSubmit,
  isLoading,
  serverError,
  initialPhone = '',
  initialStudentId = '',
}) {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [phone, setPhone] = useState(initialPhone)
  const [studentId, setStudentId] = useState(initialStudentId)
  const [touched, setTouched] = useState({ phone: false, studentId: false })
  const [clientErrors, setClientErrors] = useState({ phone: '', studentId: '' })

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(raw)
    if (touched.phone) {
      if (!raw) {
        setClientErrors((p) => ({ ...p, phone: isHindi ? 'मोबाइल नंबर आवश्यक है' : 'Mobile number is required' }))
      } else if (!validatePhone(raw)) {
        setClientErrors((p) => ({
          ...p,
          phone: isHindi ? 'मान्य 10 अंकों का नंबर दर्ज करें (6-9 से शुरू)' : 'Enter a valid 10-digit number',
        }))
      } else {
        setClientErrors((p) => ({ ...p, phone: '' }))
      }
    }
  }

  const handleIdChange = (e) => {
    const raw = e.target.value.toUpperCase()
    setStudentId(raw)
    if (touched.studentId) {
      if (!raw) {
        setClientErrors((p) => ({ ...p, studentId: isHindi ? 'विद्यार्थी ID आवश्यक है' : 'Student ID is required' }))
      } else if (!validateStudentId(raw)) {
        setClientErrors((p) => ({
          ...p,
          studentId: isHindi ? 'मान्य ID दर्ज करें (उदा. STU-0219)' : 'Enter a valid ID (e.g. STU-0219)',
        }))
      } else {
        setClientErrors((p) => ({ ...p, studentId: '' }))
      }
    }
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    if (field === 'phone') {
      if (!phone) {
        setClientErrors((p) => ({ ...p, phone: isHindi ? 'मोबाइल नंबर आवश्यक है' : 'Mobile number is required' }))
      } else if (!validatePhone(phone)) {
        setClientErrors((p) => ({
          ...p,
          phone: isHindi ? 'मान्य 10 अंकों का नंबर दर्ज करें' : 'Enter a valid 10-digit number',
        }))
      } else {
        setClientErrors((p) => ({ ...p, phone: '' }))
      }
    }
    if (field === 'studentId') {
      if (!studentId) {
        setClientErrors((p) => ({ ...p, studentId: isHindi ? 'विद्यार्थी ID आवश्यक है' : 'Student ID is required' }))
      } else if (!validateStudentId(studentId)) {
        setClientErrors((p) => ({
          ...p,
          studentId: isHindi ? 'मान्य ID दर्ज करें (उदा. STU-0219)' : 'Enter a valid ID (e.g. STU-0219)',
        }))
      } else {
        setClientErrors((p) => ({ ...p, studentId: '' }))
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched({ phone: true, studentId: true })

    const phoneClean = cleanPhone(phone)
    const idTrimmed = studentId.trim().toUpperCase()

    let hasErr = false
    const errs = { phone: '', studentId: '' }

    if (!validatePhone(phoneClean)) {
      errs.phone = isHindi ? 'मान्य 10 अंकों का नंबर दर्ज करें' : 'Enter a valid 10-digit number'
      hasErr = true
    }
    if (!validateStudentId(idTrimmed)) {
      errs.studentId = isHindi ? 'मान्य ID दर्ज करें (उदा. STU-0219)' : 'Enter a valid Student ID'
      hasErr = true
    }

    setClientErrors(errs)
    if (hasErr) return

    onSubmit({ phone: phoneClean, studentId: idTrimmed })
  }

  const generalError = getErrorMessage(serverError, isHindi ? 'hi' : 'en')

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="activation-info-box">
        <UserCheck size={16} aria-hidden="true" />
        <p>
          {isHindi
            ? 'खाता सक्रिय करने के लिए आपका मोबाइल नंबर कोचिंग सेंटर पर पंजीकृत होना चाहिए।'
            : 'To activate your parent account, your mobile number must be registered with the centre.'}
        </p>
      </div>

      {/* Field: Registered Mobile */}
      <div className="auth-field">
        <label htmlFor="act-phone" className="auth-label">
          {isHindi ? 'सेंटर पर पंजीकृत मोबाइल नंबर' : 'Mobile number registered at the centre'}
        </label>

        <div className={`auth-input-group ${clientErrors.phone ? 'input-error' : ''}`}>
          <span className="auth-prefix" aria-hidden="true">
            <span className="flag-icon">🇮🇳</span> +91
          </span>
          <input
            id="act-phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="9876543210"
            className="auth-input with-prefix tabular"
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur('phone')}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={Boolean(clientErrors.phone)}
            aria-describedby={clientErrors.phone ? 'act-phone-error' : undefined}
            autoFocus
          />
        </div>

        {clientErrors.phone && (
          <div id="act-phone-error" className="auth-error-msg" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{clientErrors.phone}</span>
          </div>
        )}
      </div>

      {/* Field: Student ID */}
      <div className="auth-field">
        <label htmlFor="act-student-id" className="auth-label">
          {isHindi ? 'विद्यार्थी ID' : 'Student ID'}
        </label>

        <div className={`auth-input-wrap ${clientErrors.studentId ? 'input-error' : ''}`}>
          <input
            id="act-student-id"
            name="studentId"
            type="text"
            autoCapitalize="characters"
            placeholder="STU-0219"
            className="auth-input tabular"
            value={studentId}
            onChange={handleIdChange}
            onBlur={() => handleBlur('studentId')}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={Boolean(clientErrors.studentId)}
            aria-describedby={clientErrors.studentId ? 'act-id-error' : 'act-id-helper'}
          />
        </div>

        {clientErrors.studentId ? (
          <div id="act-id-error" className="auth-error-msg" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{clientErrors.studentId}</span>
          </div>
        ) : (
          <p id="act-id-helper" className="auth-helper-text">
            {isHindi
              ? 'प्रवेश रसीद या पहचान पत्र पर उल्लिखित (उदा. STU-0219)'
              : 'As printed on the admission receipt or student card (e.g. STU-0219)'}
          </p>
        )}
      </div>

      {/* Server Generic Error */}
      {generalError && (
        <div className="auth-error-msg" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>
            {generalError}
            {serverError?.code === 'ALREADY_ACTIVATED' && (
              <>
                {' '}
                <Link to="/signin" className="auth-inline-link">
                  {isHindi ? 'साइन इन करें →' : 'Sign in here →'}
                </Link>
              </>
            )}
          </span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary auth-btn-submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="spin-icon" aria-hidden="true" />
            <span>{isHindi ? 'सत्यापन हो रहा है...' : 'Checking records...'}</span>
          </>
        ) : (
          <>
            <span>{isHindi ? 'आगे बढ़ें' : 'Continue'}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </button>

      {/* Switch to Sign In */}
      <div className="auth-switch-box">
        <p>
          {isHindi ? 'पहले ही सक्रिय कर चुके हैं?' : 'Already activated?'}{' '}
          <Link to="/signin" className="auth-accent-link">
            {isHindi ? 'साइन इन करें' : 'Sign in'}
          </Link>
        </p>
      </div>
    </form>
  )
}
