import { Link } from 'react-router-dom'
import { LogOut, FileSpreadsheet, User } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useLang } from '../i18n/useLang'

export default function AccountsPlaceholder() {
  const { user, logout } = useAuth()
  const { lang, setLang } = useLang()
  const isHindi = lang === 'hi'

  return (
    <div className={`portal-page accounts-portal ${isHindi ? 'hindi' : ''}`}>
      {/* Header */}
      <header className="portal-header accounts-header">
        <div className="container portal-header-inner">
          <Link className="brand" to="/">
            <span>FeeDesk <small className="header-role-chip">Accounts</small></span>
          </Link>

          <div className="portal-user-meta">
            <span className="portal-chip">
              <User size={13} aria-hidden="true" />
              <span>{user?.name || 'Staff'} ({user?.centre || 'Jaipur'})</span>
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
        {/* Top KPI row */}
        <div className="accounts-kpi-row">
          <div className="acc-kpi-card">
            <span className="kpi-meta-label">{isHindi ? 'कुल बकाया' : 'Total Due'}</span>
            <div className="kpi-big-num tabular">₹62.4L</div>
            <span className="kpi-sub-tag">All centres</span>
          </div>

          <div className="acc-kpi-card alert-card">
            <span className="kpi-meta-label">{isHindi ? '60 दिन से अधिक बकाया' : 'Over 60 Days Overdue'}</span>
            <div className="kpi-big-num red tabular">₹8.1L</div>
            <span className="kpi-sub-tag">Action needed</span>
          </div>

          <div className="acc-kpi-card success-card">
            <span className="kpi-meta-label">{isHindi ? 'इस माह एकत्रित' : 'Collected This Month'}</span>
            <div className="kpi-big-num green tabular">₹1.9Cr</div>
            <span className="kpi-sub-tag">+14% vs last month</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="accounts-action-bar">
          <div>
            <h2 className="acc-section-title">{isHindi ? 'सेंटर बकाया एवं एजिंग' : 'Centre Ageing & Dues Overview'}</h2>
            <p className="acc-section-sub">Real-time sync with Tally ERP 9 / Prime</p>
          </div>

          <button
            type="button"
            className="btn btn-primary tally-btn"
            onClick={() => alert('Simulated: Exporting latest dues ledger to Tally XML/Excel')}
          >
            <FileSpreadsheet size={16} aria-hidden="true" />
            <span>{isHindi ? 'Tally में एक्सपोर्ट करें' : 'Export to Tally'}</span>
          </button>
        </div>

        {/* Overview Table */}
        <div className="accounts-table-card">
          <table className="mini-table full-acc-table" aria-label="Accounts dues overview">
            <thead>
              <tr>
                <th>Centre</th>
                <th>Batch</th>
                <th>Student</th>
                <th>Due Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Vaishali Nagar</td>
                <td>JEE Evening 2027</td>
                <td>Ishita Sharma (STU-0587)</td>
                <td className="tabular">₹15,000</td>
                <td><span className="badge-red">23 days overdue</span></td>
              </tr>
              <tr>
                <td>Malviya Nagar</td>
                <td>NEET Morning 2027</td>
                <td>Mohit Gurjar (STU-0219)</td>
                <td className="tabular">₹22,000</td>
                <td><span className="badge-amber">Due in 13 days</span></td>
              </tr>
              <tr>
                <td>C-Scheme</td>
                <td>JEE Weekend 2026</td>
                <td>Karan Rathore (STU-0108)</td>
                <td className="tabular">₹9,500</td>
                <td><span className="badge-red">61 days overdue</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notice */}
        <div className="portal-notice-box" role="status">
          <p>
            {isHindi
              ? 'अकाउंट्स डैशबोर्ड का प्रोटोटाइप सक्रिय है। वास्तविक डेटाबेस एकीकरण अगली रिलीज़ में आएगा।'
              : 'Accounts dashboard prototype is active. Tally batch synchronization is enabled in mock mode.'}
          </p>
        </div>
      </main>
    </div>
  )
}
