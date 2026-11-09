import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useLang } from '../i18n/useLang'
import { useAuth } from '../context/useAuth'

export default function Navbar() {
  const { lang, setLang, t } = useLang()
  const { user, role, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeButtonRef = useRef(null)

  // Scroll listener for sticky 1px border
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Keyboard navigation: Escape key closes mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      closeButtonRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const navHrefs = ['#how-it-works', '#parents', '#accounts', '/refund-policy']

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <nav className="site-nav" aria-label="Main Navigation">
        {/* Left: Brand Monogram & Wordmark Lockup */}
        <Link to="/" className="brand-lockup" aria-label="FeeDesk Home">
          <svg
            className="brand-monogram"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            fill="none"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" fill="#0E4D44" />
            <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
            <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
            <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
            <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
          </svg>
          <span className="brand-wordmark">FeeDesk</span>
        </Link>

        {/* Centre: Editorial Nav Links (Desktop) */}
        <div className="nav-menu-desktop hidden md:flex items-center gap-6 lg:gap-8" role="list">
          {t.nav.links.map((label, idx) => {
            const href = navHrefs[idx]
            const isInternal = href.startsWith('#')
            if (isInternal) {
              return (
                <a key={label} href={href} className="nav-link" role="listitem">
                  {label}
                </a>
              )
            }
            return (
              <Link key={label} to={href} className="nav-link" role="listitem">
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right: Language switch + Actions */}
        <div className="nav-actions">
          {/* Plain Text Language Toggle: EN / हिं */}
          <div className="lang-text-toggle" role="group" aria-label="Choose language">
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

          {user ? (
            <div className="nav-auth-group hidden md:flex items-center gap-3 lg:gap-4">
              <Link
                to={role === 'parent' ? '/portal' : '/accounts'}
                className="btn-editorial-primary"
              >
                {role === 'parent' ? t.nav.portal : t.nav.dashboard}
              </Link>
              <button
                type="button"
                className="nav-text-link"
                onClick={logout}
              >
                {t.nav.signOut}
              </button>
            </div>
          ) : (
            <div className="nav-auth-group hidden md:flex items-center gap-3 lg:gap-4">
              <Link to="/signin" className="nav-text-link">
                {t.nav.signIn}
              </Link>
              <Link to="/signup" className="btn-editorial-primary">
                {t.nav.signUp}
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger (Visible ONLY on mobile < 768px) */}
          <button
            type="button"
            className="mobile-menu-trigger md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-expanded={mobileMenuOpen}
            aria-label="Open mobile navigation menu"
          >
            <Menu size={22} strokeWidth={1.8} />
          </button>
        </div>
      </nav>

      {/* Accessible Full-Screen Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-sheet-overlay" role="dialog" aria-modal="true" aria-label="Mobile Menu">
          <div className="mobile-sheet-header">
            <Link
              to="/"
              className="brand-lockup"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#0E4D44" />
                <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
                <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
                <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
                <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
              </svg>
              <span className="brand-wordmark">FeeDesk</span>
            </Link>

            <button
              ref={closeButtonRef}
              type="button"
              className="mobile-sheet-close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          <div className="mobile-sheet-body">
            <div className="mobile-sheet-links">
              {t.nav.links.map((label, idx) => {
                const href = navHrefs[idx]
                const isInternal = href.startsWith('#')
                if (isInternal) {
                  return (
                    <a
                      key={label}
                      href={href}
                      className="mobile-sheet-link"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {label}
                    </a>
                  )
                }
                return (
                  <Link
                    key={label}
                    to={href}
                    className="mobile-sheet-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>

            <div className="mobile-sheet-actions">
              {user ? (
                <>
                  <Link
                    to={role === 'parent' ? '/portal' : '/accounts'}
                    className="btn-editorial-primary w-full text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {role === 'parent' ? t.nav.portal : t.nav.dashboard}
                  </Link>
                  <button
                    type="button"
                    className="btn-editorial-ghost w-full"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      logout()
                    }}
                  >
                    {t.nav.signOut}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="btn-editorial-primary w-full text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t.nav.signUp}
                  </Link>
                  <Link
                    to="/signin"
                    className="btn-editorial-ghost w-full text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t.nav.signIn}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
