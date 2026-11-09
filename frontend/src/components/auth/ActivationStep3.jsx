import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ShieldCheck, Loader2, User, Bell } from 'lucide-react'
import { validateName } from '../../utils/validators'
import { getErrorMessage } from '../../utils/errorMap'
import { useLang } from '../../i18n/useLang'

export default function ActivationStep3({
  student,
  onSubmit,
  isLoading,
  serverError,
}) {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const [guardianName, setGuardianName] = useState('')
  const [relationship, setRelationship] = useState('Father')
  const [prefLang, setPrefLang] = useState(lang === 'hi' ? 'hi' : 'en')
  const [consentGiven, setConsentGiven] = useState(false)
  const [reminderOptIn, setReminderOptIn] = useState(false)
  const [nameTouched, setNameTouched] = useState(false)
  const [nameError, setNameError] = useState('')

  const handleNameChange = (e) => {
    const val = e.target.value
    setGuardianName(val)
    if (nameTouched) {
      if (!val.trim()) {
        setNameError(isHindi ? 'कृपया अपना पूरा नाम दर्ज करें' : 'Parent name is required')
      } else if (!validateName(val)) {
        setNameError(isHindi ? 'कम से कम 2 अक्षर आवश्यक' : 'Must be at least 2 characters')
      } else {
        setNameError('')
      }
    }
  }

  const handleBlur = () => {
    setNameTouched(true)
    if (!guardianName.trim()) {
      setNameError(isHindi ? 'कृपया अपना पूरा नाम दर्ज करें' : 'Parent name is required')
    } else if (!validateName(guardianName)) {
      setNameError(isHindi ? 'कम से कम 2 अक्षर आवश्यक' : 'Must be at least 2 characters')
    } else {
      setNameError('')
    }
  }

  const isFormValid =
    validateName(guardianName) &&
    relationship &&
    consentGiven

  const handleSubmit = (e) => {
    e.preventDefault()
    setNameTouched(true)
    if (!validateName(guardianName)) {
      setNameError(isHindi ? 'कृपया अपना पूरा नाम दर्ज करें' : 'Please enter your full name')
      return
    }
    if (!consentGiven) return

    onSubmit({
      guardianName: guardianName.trim(),
      relationship,
      language: prefLang,
      reminderOptIn,
      consentGiven: true,
    })
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {/* Student Read-only Preview Box */}
      <div className="student-confirm-card" role="region" aria-label="Student details">
        <div className="confirm-icon-box" aria-hidden="true">
          <CheckCircle2 size={18} />
        </div>
        <div className="confirm-content">
          <span className="confirm-sub">
            {isHindi ? 'सत्यापित विद्यार्थी रिकॉर्ड' : 'Verified student record'}
          </span>
          <h3 className="confirm-name">
            {student?.studentName || 'Student'}
          </h3>
          <p className="confirm-batch">
            {student?.batch} • {student?.centre || 'Jaipur Centre'}
          </p>
          <span className="confirm-id tabular">{student?.studentId}</span>
        </div>
      </div>

      {/* Field: Guardian Name */}
      <div className="auth-field">
        <label htmlFor="guardian-name" className="auth-label">
          {isHindi ? 'अभिभावक का पूरा नाम' : 'Your full name (Parent / Guardian)'}
        </label>

        <div className={`auth-input-wrap ${nameError ? 'input-error' : ''}`}>
          <User size={16} className="auth-field-icon" aria-hidden="true" />
          <input
            id="guardian-name"
            name="guardianName"
            type="text"
            autoComplete="name"
            placeholder={isHindi ? 'उदा. राजेश शर्मा' : 'e.g. Rajesh Sharma'}
            className="auth-input with-icon"
            value={guardianName}
            onChange={handleNameChange}
            onBlur={handleBlur}
            disabled={isLoading}
            aria-required="true"
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? 'name-error' : undefined}
            autoFocus
          />
        </div>

        {nameError && (
          <div id="name-error" className="auth-error-msg" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{nameError}</span>
          </div>
        )}
      </div>

      {/* Field: Relationship Select */}
      <div className="auth-field">
        <label htmlFor="relationship-select" className="auth-label">
          {isHindi ? 'विद्यार्थी से संबंध' : 'Relationship to student'}
        </label>

        <div className="auth-select-wrap">
          <select
            id="relationship-select"
            name="relationship"
            className="auth-select"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            disabled={isLoading}
          >
            <option value="Father">{isHindi ? 'पिता (Father)' : 'Father'}</option>
            <option value="Mother">{isHindi ? 'माता (Mother)' : 'Mother'}</option>
            <option value="Guardian">{isHindi ? 'अभिभावक (Legal Guardian)' : 'Legal Guardian'}</option>
          </select>
        </div>
      </div>

      {/* Field: Reminder Language Radio */}
      <div className="auth-field">
        <span className="auth-label" id="lang-pref-label">
          {isHindi ? 'रिमाइंडर भाषा प्राथमिकता' : 'Language for fee reminders'}
        </span>

        <div className="auth-radio-group" role="radiogroup" aria-labelledby="lang-pref-label">
          <label className={`auth-radio-card ${prefLang === 'en' ? 'active' : ''}`}>
            <input
              type="radio"
              name="prefLang"
              value="en"
              checked={prefLang === 'en'}
              onChange={() => setPrefLang('en')}
              disabled={isLoading}
            />
            <span className="radio-dot" aria-hidden="true" />
            <span className="radio-text">English</span>
          </label>

          <label className={`auth-radio-card ${prefLang === 'hi' ? 'active' : ''}`}>
            <input
              type="radio"
              name="prefLang"
              value="hi"
              checked={prefLang === 'hi'}
              onChange={() => setPrefLang('hi')}
              disabled={isLoading}
            />
            <span className="radio-dot" aria-hidden="true" />
            <span className="radio-text hindi">हिंदी (Hindi)</span>
          </label>
        </div>
      </div>

      {/* DPDP Act 2023 Consent Checkbox (Required) */}
      <div className="auth-field consent-box">
        <label className="auth-checkbox-label">
          <input
            type="checkbox"
            name="dpdpConsent"
            className="auth-checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            disabled={isLoading}
            required
            aria-required="true"
          />
          <span className="checkbox-custom" aria-hidden="true" />
          <span className="consent-text">
            {isHindi ? (
              <>
                मैं इस विद्यार्थी का माता-पिता या कानूनी अभिभावक हूँ। मैं शुल्क प्रबंधन के लिए मेरे बच्चे के फीस, उपस्थिति और टेस्ट डेटा को संग्रहीत करने के लिए FeeDesk को सहमति देता हूँ, जैसा कि{' '}
                <Link to="/privacy" target="_blank" className="auth-inline-link">
                  गोपनीयता और सहमति नोटिस (DPDP Act 2023)
                </Link>{' '}
                में वर्णित है। मैं सेंटर से संपर्क करके सहमति वापस ले सकता हूँ।
              </>
            ) : (
              <>
                I am the parent or legal guardian of this student. I consent to FeeDesk storing my child's fee, attendance and test data for fee management, as described in the{' '}
                <Link to="/privacy" target="_blank" className="auth-inline-link">
                  Privacy and consent notice (DPDP Act 2023)
                </Link>
                . I can withdraw consent by contacting the centre.
              </>
            )}
          </span>
        </label>
      </div>

      {/* Optional WhatsApp/SMS Reminder Checkbox */}
      <div className="auth-field optin-box">
        <label className="auth-checkbox-label">
          <input
            type="checkbox"
            name="reminderOptIn"
            className="auth-checkbox"
            checked={reminderOptIn}
            onChange={(e) => setReminderOptIn(e.target.checked)}
            disabled={isLoading}
          />
          <span className="checkbox-custom" aria-hidden="true" />
          <span className="optin-text">
            <Bell size={14} className="optin-icon" aria-hidden="true" />
            {isHindi
              ? 'मुझे SMS और WhatsApp पर फीस रिमाइंडर भेजें (वैकल्पिक)'
              : 'Send me reminders by SMS and WhatsApp (Optional)'}
          </span>
        </label>
      </div>

      {/* Server Error Message */}
      {serverError && (
        <div className="auth-error-msg" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{getErrorMessage(serverError, isHindi ? 'hi' : 'en')}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="btn btn-primary auth-btn-submit"
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="spin-icon" aria-hidden="true" />
            <span>{isHindi ? 'खाता सक्रिय हो रहा है...' : 'Activating account...'}</span>
          </>
        ) : (
          <span>{isHindi ? 'खाता सक्रिय करें' : 'Activate my account'}</span>
        )}
      </button>

      {/* Legal Footer Note */}
      <div className="auth-dpdp-note">
        <ShieldCheck size={14} aria-hidden="true" />
        <span>
          {isHindi
            ? 'डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP) 2023 के तहत सुरक्षित।'
            : 'Protected under the Digital Personal Data Protection (DPDP) Act 2023.'}
        </span>
      </div>
    </form>
  )
}
