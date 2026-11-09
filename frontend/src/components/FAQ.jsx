import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

export default function FAQ({ t }) {
  const { faq } = t
  const [openIndex, setOpenIndex] = useState(0) // Default first item open for immediate scan

  const toggleAccordion = (idx) => {
    setOpenIndex((prev) => (prev === idx ? -1 : idx))
  }

  return (
    <section className="faq-section" aria-labelledby="faq-heading">
      <div className="site-container faq-container">
        <div className="faq-header">
          <p className="eyebrow-label">{faq.eyebrow}</p>
          <h2 id="faq-heading" className="editorial-h2">
            {faq.title}
          </h2>
        </div>

        <div className="faq-accordion-list" role="region" aria-label="Frequently Asked Questions">
          {faq.questions.map((item, idx) => {
            const isOpen = openIndex === idx
            const contentId = `faq-answer-${idx}`
            const buttonId = `faq-button-${idx}`

            return (
              <div key={item.q} className={`faq-accordion-item ${isOpen ? 'is-open' : ''}`}>
                <button
                  id={buttonId}
                  type="button"
                  className="faq-question-button"
                  onClick={() => toggleAccordion(idx)}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                >
                  <span className="faq-question-text">{item.q}</span>
                  <span className="faq-icon-wrap" aria-hidden="true">
                    {isOpen ? <Minus size={18} strokeWidth={1.5} /> : <Plus size={18} strokeWidth={1.5} />}
                  </span>
                </button>

                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`faq-answer-collapse ${isOpen ? 'expanded' : 'collapsed'}`}
                >
                  <p className="faq-answer-text">{item.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
