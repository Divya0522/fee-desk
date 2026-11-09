import { Link } from 'react-router-dom'
import { ArrowRight, ShieldAlert } from 'lucide-react'

export default function StaffFeatures({ t }) {
  const { accounts } = t

  return (
    <section id="accounts" className="dark-accounts-section" aria-labelledby="accounts-heading">
      <div className="site-container">
        <div className="dark-accounts-grid">
          {/* Left Column (5 cols): Editorial Points */}
          <div className="dark-accounts-copy">
            <p className="eyebrow-label text-muted-dark">{accounts.eyebrow}</p>
            <h2 id="accounts-heading" className="editorial-h2 text-dark-text">
              {accounts.title}
            </h2>

            <div className="dark-points-list" role="list">
              {accounts.points.map((point) => (
                <div key={point.title} className="dark-point-item" role="listitem">
                  <h3 className="dark-point-title">{point.title}</h3>
                  <p className="dark-point-text">{point.text}</p>
                </div>
              ))}
            </div>

            <div className="dark-actions-row">
              <Link to="/signin?role=staff" className="btn-editorial-outline-dark">
                <span>{accounts.login}</span>
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          {/* Right Column (7 cols): Flat White Card Dashboard Mock */}
          <div className="dark-dashboard-col">
            <div className="white-dashboard-card" role="region" aria-label="FeeDesk accounts dashboard preview">
              <div className="dashboard-card-header">
                <div>
                  <span className="dash-heading font-semibold text-ink">Institutional Fee Overview</span>
                  <span className="dash-sub">Jaipur Main, South, Kota, Sikar</span>
                </div>
                <span className="sample-tag">{accounts.sample}</span>
              </div>

              {/* 3 KPI Numbers */}
              <div className="dash-kpi-grid">
                {accounts.kpis.map((kpi) => (
                  <div key={kpi.label} className="dash-kpi-cell">
                    <span className="kpi-label">{kpi.label}</span>
                    <span className="kpi-val tabular">{kpi.value}</span>
                  </div>
                ))}
              </div>

              {/* Ageing Bar Chart Mock */}
              <div className="dash-ageing-block">
                <span className="ageing-head">{accounts.ageingTitle}</span>
                <div className="ageing-bars-row">
                  {accounts.ageingBars.map((bar) => (
                    <div key={bar.label} className="ageing-bar-col">
                      <span className="ageing-val-pill tabular">{bar.value}</span>
                      <div className="ageing-track-flat">
                        <div
                          className="ageing-fill-flat"
                          style={{ height: `${bar.height}%` }}
                        />
                      </div>
                      <span className="ageing-label">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Small Clean Data Table */}
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      {accounts.tableHeaders.map((h, i) => (
                        <th key={h} className={i >= 2 ? 'text-right' : 'text-left'}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.tableRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold text-ink">{row[0]}</td>
                        <td className="text-body text-xs">{row[1]}</td>
                        <td className="text-right tabular font-bold text-ink">{row[2]}</td>
                        <td className="text-right text-status-overdue tabular text-xs font-semibold">
                          {row[3]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Crucial Institutional Guarantee / Counsellor Task Note */}
            <div className="counsellor-guarantee-note" role="note">
              <ShieldAlert size={18} strokeWidth={1.5} className="note-shield-icon flex-shrink-0" />
              <p className="counsellor-note-text">
                {accounts.counsellorNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
