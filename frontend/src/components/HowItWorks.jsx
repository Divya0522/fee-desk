export default function HowItWorks({ t }) {
  const { how } = t

  return (
    <section id="how-it-works" className="how-section" aria-labelledby="how-heading">
      <div className="site-container">
        <div className="how-header-block">
          <p className="eyebrow-label">{how.eyebrow}</p>
          <h2 id="how-heading" className="editorial-h2">
            {how.title}
          </h2>
        </div>

        <div className="how-body-grid">
          {/* Timeline of 3 Steps */}
          <div className="how-timeline-col">
            <div className="timeline-track" aria-hidden="true" />

            <div className="timeline-steps" role="list">
              {how.steps.map((step) => (
                <div key={step.num} className="timeline-step" role="listitem">
                  <span className="step-numeral tabular">{step.num}</span>
                  <div className="step-body">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-text">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coaching Classroom Photography Frame */}
          <div className="how-photo-col">
            <div className="classroom-photo-wrap">
              <picture>
                <source type="image/svg+xml" srcSet="/images/classroom.svg" />
                <source type="image/webp" srcSet="/images/classroom.webp" />
                <img
                  src="/images/classroom.svg"
                  alt="Coaching institute classroom in Jaipur with students studying attentively"
                  width="900"
                  height="600"
                  loading="lazy"
                  className="classroom-photo"
                />
              </picture>
              <div className="photo-warm-wash" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
