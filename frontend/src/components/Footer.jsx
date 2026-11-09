import { Link } from 'react-router-dom'
import { useLang } from '../i18n/useLang'

export default function Footer() {
  const { lang, setLang, t } = useLang()
  const { footer } = t

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-container">
        {/* Main 4-Column Grid */}
        <div className="footer-top-grid">
          {/* Col 1: Brand & Identity */}
          <div className="footer-brand-col">
            <Link to="/" className="brand-lockup footer-brand" aria-label="FeeDesk Home">
              <svg viewBox="0 0 32 32" width="30" height="30" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#0E4D44" />
                <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
                <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
                <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
                <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
              </svg>
              <span className="brand-wordmark text-white">FeeDesk</span>
            </Link>
            <p className="footer-tagline">{footer.tagline}</p>
            <p className="footer-location">{footer.company}</p>
          </div>

          {/* Col 2: Product */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">{footer.productTitle}</h4>
            <ul className="footer-links-list">
              {footer.productLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="footer-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Legal */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">{footer.legalTitle}</h4>
            <ul className="footer-links-list">
              {footer.legalLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Access & Help */}
          <div className="footer-nav-col">
            <h4 className="footer-col-title">{footer.helpTitle}</h4>
            <ul className="footer-links-list">
              {footer.helpLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="footer-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Legal strip & Language Toggle */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-left">
            <p className="footer-copyright-text">{footer.copyright}</p>
          </div>

          <div className="footer-bottom-right">
            <div className="footer-lang-toggle" role="group" aria-label="Choose language">
              <button
                type="button"
                className={`footer-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >
                EN
              </button>
              <span className="footer-lang-sep" aria-hidden="true">/</span>
              <button
                type="button"
                className={`footer-lang-btn ${lang === 'hi' ? 'active' : ''}`}
                onClick={() => setLang('hi')}
                aria-pressed={lang === 'hi'}
              >
                हिं
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
