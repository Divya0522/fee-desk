import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calculator, 
  ShieldCheck, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Phone,
  HelpCircle,
  Building2,
  Calendar,
  Check,
  ChevronRight
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import * as policyApi from '../services/policyApi'
import { formatPaise } from '../utils/format'
import { useLang } from '../i18n/useLang'
import { useAuth } from '../context/useAuth'

export default function RefundPolicy() {
  const { lang, setLang } = useLang()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isHindi = lang === 'hi'

  const { data: policy, isLoading, error } = useApi(policyApi.getRefundPolicy, [])

  // Fallback defaults if backend is loading or unavailable
  const rules = policy?.rules || [
    {
      id: 'registration_deduction',
      title: { en: 'Administrative Registration Fee', hi: 'प्रशासनिक पंजीकरण शुल्क' },
      description: {
        en: 'A non-refundable deduction of 5% of course tuition (capped at ₹5,000) is retained toward admission processing, study kit, and student LMS onboarding.',
        hi: 'कोर्स शुल्क का 5% (अधिकतम ₹5,000) गैर-वापसी योग्य प्रशासनिक शुल्क के रूप में प्रवेश प्रक्रिया, अध्ययन सामग्री और LMS ऑनबोर्डिंग हेतु रखा जाता है।',
      },
    },
    {
      id: 'pro_rata_consumption',
      title: { en: 'Daily Pro-Rata Tuition Consumption', hi: 'दैनिक अनुपात पर शिक्षण शुल्क कटौती' },
      description: {
        en: 'Tuition consumed is calculated strictly on elapsed calendar days: Consumed = (Days Elapsed ÷ Total Session Days) × Total Net Tuition Fee.',
        hi: 'उपभुक्त शिक्षण शुल्क की गणना बीते दिनों के सटीक अनुपात पर होती है: उपभुक्त शुल्क = (सत्र के बीते दिन ÷ कुल दिन) × शुद्ध शिक्षण शुल्क।',
      },
    },
    {
      id: 'payout_window',
      title: { en: 'Mandatory 10-Day Payout Guarantee', hi: '10-दिवसीय अनिवार्य भुगतान गारंटी' },
      description: {
        en: 'All approved refund claims must be credited directly to the verified parent bank account within 10 calendar days of official withdrawal notice.',
        hi: 'सभी स्वीकृत रिफंड संस्थान छोड़ने की औपचारिक सूचना तिथि से 10 कैलेंडर दिनों के भीतर सीधे अभिभावक के सत्यापित बैंक खाते में जमा किए जाएंगे।',
      },
    },
    {
      id: 'gst_treatment',
      title: { en: 'GST Treatment on Refunds', hi: 'जीएसटी (GST) नियम' },
      description: {
        en: 'GST (18%) is legally applicable only to the retained tuition and non-refundable deduction portion. Unconsumed refunded tuition is returned without tax retention.',
        hi: 'जीएसटी (18%) केवल संस्थान द्वारा रखी गई राशि और प्रशासनिक शुल्क पर लागू है; अप्रयुक्त वापस की जाने वाली फीस पर कोई टैक्स कटौती नहीं होती।',
      },
    },
    {
      id: 'pre_commencement',
      title: { en: 'Withdrawal Before Batch Start', hi: 'बैच शुरू होने से पूर्व निकासी' },
      description: {
        en: 'If a student withdraws prior to the official batch start date, 100% of all paid fees are refunded, less the non-refundable registration processing fee.',
        hi: 'यदि विद्यार्थी बैच शुरू होने से पहले प्रवेश रद्द करता है, तो गैर-वापसी योग्य पंजीकरण शुल्क काटकर 100% जमा फीस वापस की जाती है।',
      },
    },
  ]

  const workedExample = policy?.workedExample || {
    scenario: {
      course: 'JEE 2-Year Classroom Program',
      courseFeePaise: 12000000,
      paidPaise: 6000000,
      totalCourseDays: 365,
      daysElapsed: 73,
      elapsedPercentage: '20.0%',
    },
    calculation: {
      breakdown: {
        paidPaise: 6000000,
        deductionPaise: 500000,
        consumedPaise: 2400000,
        gstOnRetainedPaise: 522000,
      },
      refundPaise: 3100000,
    },
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#14211F] font-sans flex flex-col selection:bg-[#E6F0EE] selection:text-[#0E4D44]">
      {/* ──────────────────────────────────────────────────────────
          POLISHED HEADER & NAVIGATION
         ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FAF8F4]/95 backdrop-blur-md border-b border-[#E7E3DA]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Lockup */}
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4D44] rounded-lg">
            <svg
              viewBox="0 0 32 32"
              width="28"
              height="28"
              fill="none"
              className="flex-shrink-0"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="8" fill="#0E4D44" />
              <rect x="9" y="8" width="3" height="16" rx="1.5" fill="#FAF8F4" />
              <rect x="9" y="8" width="14" height="3.2" rx="1.6" fill="#FAF8F4" />
              <rect x="9" y="15" width="9.5" height="3" rx="1.5" fill="#FAF8F4" />
              <circle cx="21.5" cy="16.5" r="1.6" fill="#D98A1E" />
            </svg>
            <span className="font-serif font-semibold text-lg tracking-tight text-[#14211F]">
              FeeDesk
            </span>
          </Link>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Language Toggle: EN / हिं */}
            <div 
              className="inline-flex items-center border border-[#E7E3DA] rounded-md overflow-hidden bg-white text-xs font-medium"
              role="group"
              aria-label="Language selection"
            >
              <button
                type="button"
                className={`px-2.5 py-1 transition-colors ${lang === 'en' ? 'bg-[#0E4D44] text-[#FAF8F4] font-semibold' : 'text-[#4A5654] hover:text-[#14211F]'}`}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >
                EN
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 transition-colors ${lang === 'hi' ? 'bg-[#0E4D44] text-[#FAF8F4] font-semibold' : 'text-[#4A5654] hover:text-[#14211F]'}`}
                onClick={() => setLang('hi')}
                aria-pressed={lang === 'hi'}
              >
                हिं
              </button>
            </div>

            {/* Privacy Link */}
            <Link
              to="/privacy"
              className="hidden sm:inline-block text-xs font-medium text-[#4A5654] hover:text-[#0E4D44] transition-colors"
            >
              {isHindi ? 'प्राइवेसी पॉलिसी' : 'Privacy Notice'}
            </Link>

            {/* Back to Portal or Home */}
            <Link
              to={user ? '/portal' : '/'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-medium text-[#4A5654] transition-colors shadow-sm"
            >
              <ArrowLeft size={13} />
              <span>{user ? (isHindi ? 'पैरेंट पोर्टल' : 'Parent Portal') : (isHindi ? 'होम' : 'Home')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────
          MAIN CONTENT CONTAINER
         ────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[#7A8582]">
          <Link to="/" className="hover:text-[#14211F] transition-colors">Home</Link>
          <span>/</span>
          <span>Legal</span>
          <span>/</span>
          <span className="text-[#14211F] font-medium">{isHindi ? 'रिफंड नीति' : 'Refund Policy'}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-3 border-b border-[#E7E3DA] pb-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6F0EE] text-[#0E4D44]">
              <FileText size={12} />
              <span>{policy?.policyVersion || 'v1.0'}</span>
            </span>
            <span className="text-xs text-[#7A8582]">
              {isHindi ? 'प्रभावी तिथि:' : 'Effective From:'}{' '}
              <strong className="text-[#14211F]">{policy?.effectiveFrom || '2026-04-01'}</strong>
            </span>
            <span className="text-xs text-[#7A8582]">•</span>
            <span className="text-xs text-[#1F7A4D] font-medium flex items-center gap-1">
              <Clock size={12} />
              <span>10-Day Bank Payout Guarantee</span>
            </span>
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#14211F] tracking-tight">
            {isHindi ? 'संस्थान की प्रकाशित फीस रिफंड नीति' : 'Official Tuition Fee Refund Policy'}
          </h1>
          <p className="text-sm sm:text-base text-[#4A5654] max-w-2xl leading-relaxed">
            {isHindi
              ? 'पारदर्शी, दैनिक अनुपात पर आधारित और नियमों द्वारा संचालित रिफंड व्यवस्था — किसी भी अप्रत्याशित कटौती के बिना और सीधे बैंक ट्रांसफर गारंटी के साथ।'
              : 'Transparent, calendar-day pro-rata withdrawal rules with deterministic calculations and mandatory 10-day direct bank payout guarantee.'}
          </p>
        </div>

        {/* ──────────────────────────────────────────────────────────
            THREE-TIER QUICK TIMELINE CARDS
           ────────────────────────────────────────────────────────── */}
        <section aria-label="Refund Timeline Overview">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-[#7A8582] mb-3">
            {isHindi ? 'त्वरित रिफंड समय-सीमा (अवलोकन)' : 'Refund Timeline Overview'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-sm space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-[#E8F4EC] text-[#1F7A4D]">
                100% Refund
              </span>
              <h3 className="font-serif font-semibold text-base text-[#14211F]">
                {isHindi ? '1 से 15 दिन' : 'Days 1 to 15'}
              </h3>
              <p className="text-xs text-[#4A5654] leading-relaxed">
                {isHindi
                  ? 'बैच शुरू होने के 15 दिनों के भीतर आवेदन करने पर 100% ट्यूशन फीस वापस की जाती है (पंजीकरण शुल्क घटाकर)।'
                  : '100% tuition fee refund if withdrawal notice is submitted within 15 calendar days of batch start date.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-sm space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-[#FFF4E0] text-[#9A5B0B]">
                50% Refund
              </span>
              <h3 className="font-serif font-semibold text-base text-[#14211F]">
                {isHindi ? '16 से 30 दिन' : 'Days 16 to 30'}
              </h3>
              <p className="text-xs text-[#4A5654] leading-relaxed">
                {isHindi
                  ? '16वें से 30वें दिन के बीच आवेदन करने पर 50% अप्रयुक्त ट्यूशन फीस वापस की जाती है।'
                  : '50% tuition fee refund for withdrawal requests received between calendar days 16 and 30.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-sm space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-[#FAF8F4] text-[#7A8582] border border-[#E7E3DA]">
                Non-refundable
              </span>
              <h3 className="font-serif font-semibold text-base text-[#14211F]">
                {isHindi ? '30 दिनों के पश्चात' : 'After 30 Days'}
              </h3>
              <p className="text-xs text-[#4A5654] leading-relaxed">
                {isHindi
                  ? 'सत्र के 30 दिनों के पश्चात कोई रिफंड देय नहीं होता क्योंकि कक्षा सीट और संसाधन पूर्णतः आवंटित हो चुके होते हैं।'
                  : 'Tuition becomes non-refundable after 30 days as batch classroom seats, teacher allocation, and study resources are finalized.'}
              </p>
            </div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            RULES + WORKED EXAMPLE GRID
           ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Detailed Policy Rules */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-serif font-bold text-xl text-[#14211F]">
              {isHindi ? 'नीति के मुख्य नियम (नियमबद्ध विवरण)' : 'Policy Principles (Written Rules)'}
            </h2>

            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div key={rule.id || idx} className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-sm flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#E6F0EE] text-[#0E4D44] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-[#14211F]">
                      {isHindi ? rule.title.hi : rule.title.en}
                    </h3>
                    <p className="text-xs text-[#4A5654] leading-relaxed">
                      {isHindi ? rule.description.hi : rule.description.en}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Worked Example Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="font-serif font-bold text-xl text-[#14211F] flex items-center gap-2">
              <Calculator size={18} className="text-[#0E4D44]" />
              <span>{isHindi ? 'वास्तविक गणना उदाहरण' : 'Worked Example (Live Engine)'}</span>
            </h2>

            <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-sm space-y-4">
              <p className="text-xs text-[#7A8582]">
                {isHindi
                  ? 'यह उदाहरण उसी वास्तविक कैलकुलेटर एल्गोरिदम द्वारा परिकलित है जो अकाउंट्स पोर्टल उपयोग करता है:'
                  : 'Computed dynamically by the exact deterministic formula applied by the accounts team:'}
              </p>

              {/* Scenario details */}
              <div className="bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl p-3.5 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#7A8582]">{isHindi ? 'कोर्स:' : 'Course:'}</span>
                  <strong className="text-[#14211F]">{workedExample.scenario.course}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A8582]">{isHindi ? 'कुल सत्र शुल्क:' : 'Total Tuition:'}</span>
                  <span className="font-mono tabular-nums font-semibold text-[#14211F]">
                    {formatPaise(workedExample.scenario.courseFeePaise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A8582]">{isHindi ? 'जमा की गई राशि:' : 'Amount Paid:'}</span>
                  <span className="font-mono tabular-nums font-semibold text-[#1F7A4D]">
                    {formatPaise(workedExample.scenario.paidPaise)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A8582]">{isHindi ? 'सत्र में प्रयुक्त दिन:' : 'Session Elapsed:'}</span>
                  <span className="font-medium text-[#14211F]">
                    {workedExample.scenario.daysElapsed} / {workedExample.scenario.totalCourseDays} {isHindi ? 'दिन' : 'days'} ({workedExample.scenario.elapsedPercentage})
                  </span>
                </div>
              </div>

              {/* Itemized Deductions */}
              <div className="space-y-2 text-xs pt-1">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-[#7A8582] block">
                  {isHindi ? 'रिफंड गणना विवरण' : 'Itemized Deduction'}
                </span>

                <div className="flex justify-between py-1 border-b border-[#E7E3DA]/60">
                  <span className="text-[#4A5654]">{isHindi ? 'प्राप्त कुल भुगतान:' : 'Total Fee Paid:'}</span>
                  <span className="font-mono font-semibold text-[#1F7A4D]">
                    {formatPaise(workedExample.calculation.breakdown.paidPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#E7E3DA]/60">
                  <span className="text-[#4A5654]">{isHindi ? 'गैर-वापसी योग्य पंजीकरण शुल्क:' : 'Non-refundable deduction:'}</span>
                  <span className="font-mono text-[#B3261E]">
                    -{formatPaise(workedExample.calculation.breakdown.deductionPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-[#E7E3DA]/60">
                  <span className="text-[#4A5654]">{isHindi ? 'उपभुक्त शिक्षण शुल्क (20%):' : 'Consumed tuition fee (20%):'}</span>
                  <span className="font-mono text-[#B3261E]">
                    -{formatPaise(workedExample.calculation.breakdown.consumedPaise)}
                  </span>
                </div>

                <div className="flex justify-between py-1 text-[11px] text-[#7A8582]">
                  <span>{isHindi ? 'रखी गई राशि पर GST (समाहित):' : 'GST included in retained amount:'}</span>
                  <span className="font-mono">
                    {formatPaise(workedExample.calculation.breakdown.gstOnRetainedPaise)} (18%)
                  </span>
                </div>

                {/* Final Refund Line */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-[#14211F] text-sm font-semibold">
                  <span className="text-[#14211F]">
                    {isHindi ? 'देय शुद्ध रिफंड राशि:' : 'Final Payable Refund:'}
                  </span>
                  <span className="font-serif font-bold text-xl text-[#0E4D44] tabular-nums">
                    {formatPaise(workedExample.calculation.refundPaise)}
                  </span>
                </div>
              </div>

              {/* 10-day payout badge */}
              <div className="bg-[#E8F4EC] border border-[#1F7A4D]/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#1F7A4D]">
                <Clock size={16} className="flex-shrink-0 mt-0.5" />
                <p>
                  <strong>{isHindi ? 'भुगतान गारंटी:' : 'Payout Guarantee:'} </strong>
                  {isHindi
                    ? 'संस्थान छोड़ने की सूचना से 10 कैलेंडर दिनों के भीतर सीधे सत्यापित बैंक खाते में अंतरण।'
                    : 'Credited directly to the verified parent bank account within 10 calendar days of written notice.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────
            HOW TO SUBMIT A CLAIM (3 STEPS)
           ────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-sm space-y-4" aria-label="How to claim refund">
          <h2 className="font-serif font-bold text-xl text-[#14211F]">
            {isHindi ? 'रिफंड आवेदन की प्रक्रिया (तीन चरण)' : 'How to Claim a Refund (3 Simple Steps)'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-2">
              <span className="w-6 h-6 rounded-full bg-[#0E4D44] text-[#FAF8F4] font-bold text-xs flex items-center justify-center">
                1
              </span>
              <strong className="text-sm font-semibold text-[#14211F] block">
                {isHindi ? 'लिखित आवेदन प्रस्तुत करें' : 'Submit Written Notice'}
              </strong>
              <p className="text-[#4A5654] leading-relaxed">
                {isHindi
                  ? 'जयपुर सेंटर कार्यालय में फॉर्म भरकर या पंजीकृत ईमेल से support@feedesk.demo पर आवेदन भेजें।'
                  : 'Submit a signed withdrawal slip at the Jaipur Centre office or email support@feedesk.demo from your registered address.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-2">
              <span className="w-6 h-6 rounded-full bg-[#0E4D44] text-[#FAF8F4] font-bold text-xs flex items-center justify-center">
                2
              </span>
              <strong className="text-sm font-semibold text-[#14211F] block">
                {isHindi ? '48 घंटे में सत्यापन' : 'Audit & Verification'}
              </strong>
              <p className="text-[#4A5654] leading-relaxed">
                {isHindi
                  ? 'अकाउंट्स टीम लेजर, उपस्थिति और जीएसटी कटौती का सत्यापन 48 घंटों में पूर्ण करती है।'
                  : 'Accounts department verifies days elapsed, paid ledger, and tax treatment within 48 business hours.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-2">
              <span className="w-6 h-6 rounded-full bg-[#0E4D44] text-[#FAF8F4] font-bold text-xs flex items-center justify-center">
                3
              </span>
              <strong className="text-sm font-semibold text-[#14211F] block">
                {isHindi ? 'सीधे बैंक खाते में अंतरण' : 'Direct Bank Credit'}
              </strong>
              <p className="text-[#4A5654] leading-relaxed">
                {isHindi
                  ? 'स्वीकृत राशि 10 दिनों के भीतर सीधे अभिभावक के मूल बैंक खाते में NEFT/IMPS से भेज दी जाती है।'
                  : 'Approved refund amount is deposited directly via NEFT/IMPS to the original source bank account within 10 days.'}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ──────────────────────────────────────────────────────────
          FOOTER
         ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E7E3DA] py-6 bg-white text-xs text-[#7A8582]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>© 2026 FeeDesk Coaching Institute, Jaipur. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-[#14211F] transition-colors underline-offset-2 hover:underline">
              {isHindi ? 'प्राइवेसी पॉलिसी' : 'Privacy Notice'}
            </Link>
            <span>•</span>
            <a href="tel:+911412550100" className="hover:text-[#14211F] transition-colors underline-offset-2 hover:underline">
              {isHindi ? 'हेल्पलाइन: 0141-2550100' : 'Helpline: 0141-2550100'}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
