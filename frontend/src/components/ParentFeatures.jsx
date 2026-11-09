import { CheckCircle2, AlertCircle, ArrowUpRight, MessageSquare } from 'lucide-react'

export default function ParentFeatures({ t }) {
  const { parents } = t

  return (
    <section id="parents" className="parents-section" aria-labelledby="parents-heading">
      <div className="site-container">
        <div className="parents-grid">
          {/* Left Column (6 cols): Flat, faithful CSS Phone Mockup */}
          <div className="parent-mock-col">
            <div className="phone-chassis" role="region" aria-label="FeeDesk parent mobile portal preview">
              {/* Phone Status Header */}
              <div className="phone-screen-header">
                <div className="phone-header-meta">
                  <span className="phone-greeting">Hello, Rajesh</span>
                  <span className="phone-student-badge">Ishita Sharma • JEE 2027</span>
                </div>
                <span className="sample-tag">sample data</span>
              </div>

              {/* Dues Card inside Phone */}
              <div className="phone-card">
                <div className="phone-card-top">
                  <span className="phone-label">Amount due</span>
                  <span className="status-chip-overdue-sm">
                    <AlertCircle size={12} strokeWidth={1.5} aria-hidden="true" />
                    <span>26d overdue</span>
                  </span>
                </div>
                <div className="phone-amount-display tabular">₹15,000</div>
                <div className="phone-due-sub tabular">Due 10 Oct 2026 • Instalment 2 of 4</div>
                <button type="button" className="phone-btn-pay" disabled>
                  Pay now by UPI / Card
                </button>
              </div>

              {/* Fee Schedule Timeline inside Phone */}
              <div className="phone-schedule-block">
                <span className="phone-section-title">Instalment Schedule</span>
                <div className="schedule-list">
                  <div className="schedule-row">
                    <div className="schedule-left">
                      <CheckCircle2 size={15} className="text-status-paid" strokeWidth={1.5} />
                      <span className="schedule-inst-name">Instalment 1</span>
                    </div>
                    <span className="schedule-amount tabular">Paid ₹30,000</span>
                  </div>

                  <div className="schedule-row current">
                    <div className="schedule-left">
                      <div className="schedule-bullet-due" aria-hidden="true" />
                      <span className="schedule-inst-name font-semibold">Instalment 2</span>
                    </div>
                    <span className="schedule-amount tabular font-semibold text-status-overdue">Due ₹15,000</span>
                  </div>

                  <div className="schedule-row">
                    <div className="schedule-left">
                      <div className="schedule-bullet-upcoming" aria-hidden="true" />
                      <span className="schedule-inst-name text-muted">Instalment 3</span>
                    </div>
                    <span className="schedule-amount tabular text-muted">Due 15 Nov (₹15,000)</span>
                  </div>
                </div>
              </div>

              {/* Instant GST Receipt Card inside Phone */}
              <div className="phone-receipt-pill">
                <div className="receipt-pill-left">
                  <span className="receipt-dot" aria-hidden="true" />
                  <div>
                    <div className="receipt-title font-semibold">Receipt #FD-2026-0812</div>
                    <div className="receipt-sub">GSTIN: 08AAAAA0000A1Z5 • ₹30,000 Paid</div>
                  </div>
                </div>
                <span className="receipt-link-pill">PDF</span>
              </div>
            </div>
          </div>

          {/* Right Column (6 cols): Editorial list separated by thin rules */}
          <div className="parent-content-col">
            <p className="eyebrow-label">{parents.eyebrow}</p>
            <h2 id="parents-heading" className="editorial-h2">
              {parents.title}
            </h2>

            <div className="editorial-items-list" role="list">
              {parents.items.map((item) => (
                <div key={item.title} className="editorial-item" role="listitem">
                  <h3 className="editorial-item-title">{item.title}</h3>
                  <p className="editorial-item-text">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Reminder policy line + Real Hindi Reminder Message Bubble */}
            <div className="reminder-reassurance-box">
              <p className="reminder-note-line font-medium text-ink">
                {parents.reminderLine}
              </p>

              <div className="sample-sms-bubble" role="note" aria-label="Sample reminder message">
                <div className="bubble-header">
                  <div className="bubble-sender">
                    <MessageSquare size={14} className="text-brand" strokeWidth={1.5} />
                    <span>FeeDesk SMS</span>
                  </div>
                  <span className="bubble-meta">{parents.sampleBubble.note}</span>
                </div>
                <p className="bubble-message">{parents.sampleBubble.text}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
