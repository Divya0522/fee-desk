import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowLeft, WifiOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { useLang } from '../../i18n/useLang'

export default function AuthLayout({ children, title, subtitle }) {
  const { lang, setLang } = useLang()
  const isHindi = lang === 'hi'

  // Offline detection
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className={`auth-page ${isHindi ? 'hindi' : ''}`}>
      {/* Offline banner */}
      {!isOnline && (
        <div className="auth-offline-banner" role="alert">
          <WifiOff size={16} aria-hidden="true" />
          <span>{isHindi ? 'आप ऑफलाइन हैं। अपना इंटरनेट कनेक्शन जांचें।' : 'You are offline. Check your connection.'}</span>
        </div>
      )}

      <div className="auth-split-wrapper">
        {/* ============================================================
            Left Panel (Desktop >= 1024px): Deep Forest Green #0F2421
           ============================================================ */}
        <aside className="auth-left-panel" aria-label="FeeDesk branding">
          <div className="auth-left-content">
            {/* Top brand lockup */}
            <Link className="auth-brand" to="/" aria-label="FeeDesk Home">
              <span className="auth-brand-monogram" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="28" height="28" rx="8" fill="#FAF8F4" />
                  <path d="M8 8h12M8 14h8M8 20h5" stroke="#0E4D44" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="auth-brand-wordmark">FeeDesk</span>
            </Link>

            {/* Headline & subtext */}
            <div className="auth-left-copy">
              <h1 className="auth-left-headline">
                {isHindi ? (
                  <>
                    आपके बच्चे की फीस,{' '}
                    <span className="auth-accent-word">पांच सेकंड में स्पष्ट।</span>
                  </>
                ) : (
                  <>
                    Your child’s fees,{' '}
                    <span className="auth-accent-word">clear in five seconds.</span>
                  </>
                )}
              </h1>
              <p className="auth-left-subtext">
                {isHindi
                  ? 'हर किस्त देखें, एक टैप में भुगतान करें, और तुरंत आधिकारिक GST रसीदें प्राप्त करें। कोई पासवर्ड याद रखने की जरूरत नहीं।'
                  : 'See every instalment, pay in one tap, and get instant GST receipts. No passwords to remember or reset.'}
              </p>

              {/* Quiet reassurance list */}
              <ul className="auth-ticks-list" role="list">
                <li className="auth-tick-item">
                  <div className="auth-tick-badge" aria-hidden="true">
                    <CheckCircle2 size={16} strokeWidth={2.2} />
                  </div>
                  <span>{isHindi ? 'OTP लॉगिन (कोई पासवर्ड नहीं)' : 'OTP login on your registered mobile'}</span>
                </li>
                <li className="auth-tick-item">
                  <div className="auth-tick-badge" aria-hidden="true">
                    <CheckCircle2 size={16} strokeWidth={2.2} />
                  </div>
                  <span>{isHindi ? 'GST विवरण वाली डिजिटल रसीदें' : 'Instant GST receipts on WhatsApp & SMS'}</span>
                </li>
                <li className="auth-tick-item">
                  <div className="auth-tick-badge" aria-hidden="true">
                    <CheckCircle2 size={16} strokeWidth={2.2} />
                  </div>
                  <span>{isHindi ? 'DPDP अधिनियम 2023 सहमति आधारित' : 'DPDP Act 2023 consent-based & encrypted'}</span>
                </li>
              </ul>
            </div>

            {/* Quiet Footer */}
            <div className="auth-left-footer">
              <span>© 2026 Company A, Jaipur. FeeDesk Portal.</span>
            </div>
          </div>
        </aside>

        {/* ============================================================
            Right Panel: Warm Editorial White
           ============================================================ */}
        <main className="auth-right-panel" id="main-content">
          {/* Header Navigation Bar */}
          <div className="auth-top-nav">
            <Link className="auth-back-link" to="/" aria-label="Back to home page">
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>{isHindi ? 'मुख्य पृष्ठ पर वापस' : 'Back to home'}</span>
            </Link>

            {/* Mobile Brand (visible < 1024px) */}
            <Link className="auth-mobile-brand" to="/">
              <span className="brand-monogram" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="28" height="28" rx="8" fill="#0E4D44" />
                  <path d="M8 8h12M8 14h8M8 20h5" stroke="#FAF8F4" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="brand-wordmark text-[18px]">FeeDesk</span>
            </Link>

            {/* Language text toggle */}
            <div className="lang-text-toggle" role="group" aria-label="Language selection">
              <button
                type="button"
                className={`lang-text-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >
                EN
              </button>
              <span className="lang-divider" aria-hidden="true">/</span>
              <button
                type="button"
                className={`lang-text-btn ${lang === 'hi' ? 'active' : ''}`}
                onClick={() => setLang('hi')}
                aria-pressed={lang === 'hi'}
              >
                हिं
              </button>
            </div>
          </div>

          {/* Form Container (centered, max-width 420px) */}
          <div className="auth-form-container">
            {title && (
              <header className="auth-form-header">
                <h2 className="auth-form-title">{title}</h2>
                {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}
              </header>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
