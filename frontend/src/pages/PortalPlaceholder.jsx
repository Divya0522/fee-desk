import { Link } from 'react-router-dom'
import { LogOut, AlertCircle, FileText, Download, Calendar, User, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useLang } from '../i18n/useLang'

export default function PortalPlaceholder() {
  const { user, logout } = useAuth()
  const { lang, setLang } = useLang()
  const isHindi = lang === 'hi'

  return (
    <div className={`portal-page ${isHindi ? 'hindi' : ''}`}>
      {/* Top Navbar */}
      <header className="portal-header">
        <div className="container portal-header-inner">
          <Link className="brand" to="/">
            <span>FeeDesk</span>
          </Link>

          <div className="portal-user-meta">
            <span className="portal-chip">
              <User size={13} aria-hidden="true" />
              <span>{user?.name || 'Parent'}</span>
            </span>

            <div className="lang-toggle" aria-label="Choose language" role="group">
              <button
                type="button"
                className={lang === 'en' ? 'active' : ''}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >
                EN
              </button>
              <button
                type="button"
                className={lang === 'hi' ? 'active' : ''}
                onClick={() => setLang('hi')}
                aria-pressed={lang === 'hi'}
              >
                हिं
              </button>
            </div>

            <button
              type="button"
              className="btn btn-ghost portal-logout-btn"
              onClick={logout}
            >
              <LogOut size={15} aria-hidden="true" />
              <span>{isHindi ? 'लॉगआउट' : 'Log out'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container portal-main">
        {/* Welcome Banner */}
        <section className="portal-welcome-card" aria-label="Welcome">
          <div className="welcome-left">
            <span className="portal-badge">
              <ShieldCheck size={14} aria-hidden="true" />
              {isHindi ? 'सत्यापित अभिभावक खाता' : 'Verified Parent Account'}
            </span>
            <h1 className="portal-title">
              {isHindi ? `नमस्ते, ${user?.name || 'अभिभावक'}` : `Hello, ${user?.name || 'Rajesh'}`}
            </h1>
            <p className="portal-sub">
              {user?.studentName ? `${user.studentName} • ${user.batch || 'Coaching Batch'}` : 'Fee portal active'}
            </p>
          </div>

          <div className="welcome-right">
            <span className="portal-student-id tabular">{user?.studentId || 'STU-0587'}</span>
            <span className="portal-centre-tag">{user?.centre || 'Jaipur Centre'}</span>
          </div>
        </section>

        {/* Due Summary Card */}
        <div className="portal-grid">
          <article className="portal-card due-highlight-card">
            <div className="due-card-header">
              <div>
                <span className="due-label">{isHindi ? 'देय राशि' : 'Amount Due'}</span>
                <div className="due-val tabular">₹{Number(user?.amountDue || 15000).toLocaleString('en-IN')}</div>
              </div>
              <span className="status-chip-red">
                <AlertCircle size={13} aria-hidden="true" />
                {user?.overdueDays ? `${user.overdueDays} days overdue` : '23 days overdue'}
              </span>
            </div>

            <div className="due-meta-row">
              <span className="due-date">
                <Calendar size={14} aria-hidden="true" />
                {isHindi ? 'अंतिम तिथि: 10 अक्टूबर 2026' : `Due: ${user?.dueDate || '10 Oct 2026'}`}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary portal-pay-btn"
              onClick={() => alert('Online payment integration enabled for mock')}
            >
              {isHindi ? 'अभी भुगतान करें (₹15,000)' : 'Pay Now (₹15,000)'}
            </button>
          </article>

          {/* Quick Receipts Card */}
          <article className="portal-card">
            <h3 className="card-section-title">
              <FileText size={18} aria-hidden="true" />
              <span>{isHindi ? 'हालिया GST रसीदें' : 'Recent GST Receipts'}</span>
            </h3>

            <div className="receipts-list">
              <div className="receipt-item">
                <div>
                  <strong>FD-1048</strong>
                  <p>Instalment 1 • ₹30,000 (Paid)</p>
                </div>
                <button
                  type="button"
                  className="receipt-dl-btn"
                  onClick={() => alert('Downloading Receipt FD-1048 (GST Included)')}
                  aria-label="Download receipt FD-1048"
                >
                  <Download size={15} />
                  <span>GST</span>
                </button>
              </div>

              <div className="receipt-item">
                <div>
                  <strong>FD-1049</strong>
                  <p>Instalment 2 • ₹30,000 (Paid)</p>
                </div>
                <button
                  type="button"
                  className="receipt-dl-btn"
                  onClick={() => alert('Downloading Receipt FD-1049 (GST Included)')}
                  aria-label="Download receipt FD-1049"
                >
                  <Download size={15} />
                  <span>GST</span>
                </button>
              </div>
            </div>
          </article>
        </div>

        {/* Coming Next Notice */}
        <div className="portal-notice-box" role="status">
          <p>
            {isHindi
              ? 'पूर्ण पैरेंट पोर्टल विकास के अंतर्गत है। फीस रसीदें और उपस्थिति अलर्ट सक्रिय हैं।'
              : 'Full parent portal is currently in production deployment. Fee receipts and reminders are active.'}
          </p>
        </div>
      </main>
    </div>
  )
}
