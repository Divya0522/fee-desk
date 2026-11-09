import { useEffect } from 'react'
import { useLang } from '../i18n/useLang'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import TrustStrip from '../components/TrustStrip'
import HowItWorks from '../components/HowItWorks'
import ParentFeatures from '../components/ParentFeatures'
import StaffFeatures from '../components/StaffFeatures'
import RefundTrust from '../components/RefundTrust'
import FAQ from '../components/FAQ'
import FinalCTA from '../components/FinalCTA'
import Footer from '../components/Footer'

export default function Landing() {
  const { t, lang } = useLang()

  useEffect(() => {
    document.title =
      lang === 'hi'
        ? 'FeeDesk | परिवार के लिए कोचिंग फीस की स्पष्ट जानकारी'
        : 'FeeDesk | Clear coaching fees for families'
  }, [lang])

  // Simple, subtle IntersectionObserver for editorial fade-up reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )

    const revealElements = document.querySelectorAll('.editorial-reveal')
    revealElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <div className={`site-wrapper ${lang === 'hi' ? 'hindi' : ''}`}>
      {/* Accessible Skip-to-content Link */}
      <a href="#main-content" className="skip-link">
        {lang === 'hi' ? 'सीधे मुख्य सामग्री पर जाएं' : 'Skip to main content'}
      </a>

      {/* 1. Header / Navigation */}
      <Navbar />

      {/* Main Editorial Content Flow */}
      <main id="main-content">
        {/* 2. Hero Section */}
        <div className="editorial-reveal is-visible">
          <Hero t={t} />
        </div>

        {/* 3. Proof Strip */}
        <div className="editorial-reveal">
          <TrustStrip t={t} />
        </div>

        {/* 4. How It Works (Timeline + Classroom Photo) */}
        <div className="editorial-reveal">
          <HowItWorks t={t} />
        </div>

        {/* 5. For Parents (Phone Mockup + Editorial List) */}
        <div className="editorial-reveal">
          <ParentFeatures t={t} />
        </div>

        {/* 6. For Accounts Teams (Dark Section #0F2421) */}
        <div className="editorial-reveal">
          <StaffFeatures t={t} />
        </div>

        {/* 7. Fair and Written Down (Refunds & DPDP Consent) */}
        <div className="editorial-reveal">
          <RefundTrust t={t} />
        </div>

        {/* 8. FAQ Accordion */}
        <div className="editorial-reveal">
          <FAQ t={t} />
        </div>

        {/* 9. Final Call to Action */}
        <div className="editorial-reveal">
          <FinalCTA t={t} />
        </div>
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  )
}
