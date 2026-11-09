import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Calendar,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useLang } from '../i18n/useLang'

export default function Hero({ t }) {
  const { user, role, logout } = useAuth()
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const h = t.hero
  const p = t.phone

  return (
    <section className="hero-section" aria-labelledby="hero-heading">
      <div className="site-container hero-grid">
        {/* Left Column (5 cols): Editorial typography & CTAs */}
        <div className="hero-content">
          <p className="eyebrow-label">{h.eyebrow}</p>

          <h1 id="hero-heading" className="hero-h1">
            <span>{h.titleMain} </span>
            <span className="hero-accent-word">
              {h.titleAccent}
              {/* Hand-drawn saffron underline SVG */}
              <svg
                className="saffron-underline"
                viewBox="0 0 220 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3 13C50 5 150 4 217 11C165 7 85 9 12 15"
                  stroke="#D98A1E"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="hero-lead">{h.text}</p>

          <div className="hero-actions-row">
            {user ? (
              <>
                <Link
                  to={role === 'parent' ? '/portal' : '/accounts'}
                  className="btn-editorial-primary"
                >
                  {role === 'parent' ? 'Open Parent Portal' : 'Open Accounts Dashboard'}
                </Link>
                <button
                  type="button"
                  className="btn-editorial-text"
                  onClick={logout}
                >
                  <span>Sign out</span>
                  <ArrowRight size={16} strokeWidth={1.5} />
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn-editorial-primary">
                  {h.parent}
                </Link>
                <Link to="/signin?role=staff" className="btn-editorial-text">
                  <span>{h.staff}</span>
                  <ArrowRight size={16} strokeWidth={1.5} />
                </Link>
              </>
            )}
          </div>

          {/* Quiet reassurance line with three small checks */}
          <ul className="hero-ticks-list" role="list">
            {h.ticks.map((tick) => (
              <li key={tick} className="hero-tick-item">
                <CheckCircle2 size={15} strokeWidth={2.2} className="tick-icon" aria-hidden="true" />
                <span>{tick}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column (7 cols): High-Fidelity Parent Portal Payment Card */}
        <div className="hero-visual-frame">
          <div className="hero-dues-card" role="region" aria-label="Fee dues sample preview">
            {/* 1. Header: Verified Institute & Sample Tag */}
            <div className="dues-card-header">
              <div className="dues-institute-block">
                <div className="dues-monogram-badge" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="6" fill="#0E4D44" />
                    <path d="M7 7h10M7 12h7M7 17h4" stroke="#FAF8F4" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <span className="dues-institute-name">
                    {isHindi ? 'एपेक्स विद्यापीठ • जयपुर' : 'Apex Vidyapeeth • Jaipur'}
                  </span>
                  <span className="dues-portal-sub">
                    {isHindi ? 'आधिकारिक पैरेंट शुल्क पोर्टल' : 'Official Parent Fee Portal'}
                  </span>
                </div>
              </div>
              <span className="sample-badge">
                <span className="sample-badge-dot" aria-hidden="true" />
                <span>{h.sampleData}</span>
              </span>
            </div>

            {/* 2. Student Identity with Avatar */}
            <div className="dues-student-row">
              <div className="dues-student-avatar" aria-hidden="true">
                <span>IS</span>
              </div>
              <div className="dues-student-meta">
                <span className="dues-student-name">{p.student}</span>
                <span className="dues-batch-name">{p.batch}</span>
              </div>
              <span className="dues-roll-badge tabular">ID: 2026-JPR-042</span>
            </div>

            {/* 3. 4-Segment Instalment Timeline Bar */}
            <div className="dues-stepper-wrap">
              <div className="dues-stepper-bars" aria-label="Instalment progress">
                <div className="stepper-seg seg-paid" title={p.paid} />
                <div className="stepper-seg seg-overdue" title={p.due} />
                <div className="stepper-seg seg-upcoming" title={p.next} />
                <div className="stepper-seg seg-upcoming" />
              </div>
              <div className="dues-stepper-legend">
                <span className="stepper-label-current">
                  {isHindi ? 'किस्त 2 / 4' : 'Instalment 2 of 4'}
                </span>
                <span className="stepper-label-summary tabular">
                  {isHindi ? '₹30,000 जमा • ₹15,000 देय' : '₹30,000 paid • ₹15,000 due'}
                </span>
              </div>
            </div>

            {/* 4. Highlighted Outstanding Amount Block */}
            <div className="dues-amount-block">
              <div className="dues-label-row">
                <span className="dues-label">{p.due}</span>
                <span className="status-chip-overdue">
                  <AlertCircle size={12} strokeWidth={2} aria-hidden="true" />
                  <span>{p.overdue}</span>
                </span>
              </div>

              <div className="dues-value-row">
                <span className="dues-value tabular">{p.dueAmount}</span>
                <span className="dues-date-note tabular">
                  <Calendar size={13} strokeWidth={1.8} aria-hidden="true" />
                  <span>{p.date}</span>
                </span>
              </div>

              {/* Itemized Fee Breakdown */}
              <div className="dues-fee-breakdown">
                <div className="fee-item-row">
                  <span>{isHindi ? 'ट्यूशन व कक्षा शिक्षण' : 'Tuition & Classroom'}</span>
                  <span className="tabular font-medium text-ink">₹12,000</span>
                </div>
                <div className="fee-item-row">
                  <span>{isHindi ? 'स्टडी मॉड्यूल व टेस्ट सीरीज' : 'Study Modules & Tests'}</span>
                  <span className="tabular font-medium text-ink">₹3,000</span>
                </div>
                <div className="fee-item-row fee-tax-row">
                  <span>{isHindi ? 'जीएसटी (18% शामिल)' : 'GST (18% inclusive)'}</span>
                  <span className="tax-ready-badge">{isHindi ? 'रसीद तैयार' : 'Invoice ready'}</span>
                </div>
              </div>
            </div>

            {/* 5. Primary Pay CTA */}
            <Link to="/signin" className="btn-dues-pay">
              <span>{isHindi ? 'अभी ₹15,000 का भुगतान करें' : 'Pay ₹15,000 now'}</span>
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>

            {/* 6. Security Assurance & Instant Receipt */}
            <div className="dues-security-bar">
              <ShieldCheck size={14} strokeWidth={1.8} className="security-icon" aria-hidden="true" />
              <span>
                {isHindi
                  ? 'सुरक्षित पेमेंट गेटवे • तुरंत WhatsApp पर GST रसीद'
                  : '256-bit secure payment • Instant GST receipt on WhatsApp'}
              </span>
            </div>

            {/* 7. Previous Payment Confirmation */}
            <div className="dues-previous-pill">
              <div className="dues-prev-left">
                <CheckCircle2 size={13} strokeWidth={2} className="text-status-paid" aria-hidden="true" />
                <span className="tabular">
                  {isHindi
                    ? 'किस्त 1 (₹30,000) प्राप्त • रसीद #FD-2026-0812'
                    : 'Instalment 1 (₹30,000) paid • Receipt #FD-2026-0812'}
                </span>
              </div>
              <span className="dues-prev-tag">{isHindi ? 'सत्यापित' : 'Verified'}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
