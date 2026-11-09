export default function TrustStrip({ t }) {
  const items = t.trust || [
    '4 centres',
    '2,600 students',
    'GST on every receipt',
    'Consent before data is stored',
  ]

  return (
    <section className="proof-strip-section" aria-label="Institute facts">
      <div className="site-container">
        <div className="proof-strip-grid" role="list">
          {items.map((fact, index) => (
            <div key={fact} className="proof-item" role="listitem">
              <span className="proof-text">{fact}</span>
              {index < items.length - 1 && (
                <div className="proof-divider" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
