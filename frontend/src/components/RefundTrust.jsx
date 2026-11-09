import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function RefundTrust({ t }) {
  const { fair } = t

  return (
    <section className="fair-section" aria-labelledby="fair-heading">
      <div className="site-container">
        <div className="fair-header">
          <p className="eyebrow-label">{fair.eyebrow}</p>
          <h2 id="fair-heading" className="sr-only">
            Refunds and Data Protection Commitments
          </h2>
        </div>

        <div className="fair-grid">
          {/* Left Column: Published Refund Policy */}
          <article className="fair-card">
            <h3 className="fair-card-title">{fair.refundTitle}</h3>
            <p className="fair-card-text">{fair.refundText}</p>
            <div className="fair-card-action">
              <Link to="/refund-policy" className="fair-link">
                <span>{fair.refundLink}</span>
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </div>
          </article>

          {/* Right Column: DPDP Act 2023 Parental Consent */}
          <article className="fair-card">
            <h3 className="fair-card-title">{fair.consentTitle}</h3>
            <p className="fair-card-text">{fair.consentText}</p>
            <div className="fair-card-action">
              <Link to="/privacy" className="fair-link">
                <span>{fair.consentLink}</span>
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
