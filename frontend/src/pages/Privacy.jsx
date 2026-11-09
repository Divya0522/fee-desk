import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  ShieldCheck, 
  Check, 
  Info, 
  Lock, 
  Clock, 
  Eye, 
  AlertCircle,
  FileText,
  UserCheck,
  Database,
  Building2,
  Mail,
  Phone,
  HelpCircle,
  ArrowRight
} from 'lucide-react'
import { useLang } from '../i18n/useLang'
import { useAuth } from '../context/useAuth'

export default function Privacy() {
  const { lang, setLang } = useLang()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isHindi = lang === 'hi'

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

            {/* Refund Policy Link */}
            <Link
              to="/refund-policy"
              className="hidden sm:inline-block text-xs font-medium text-[#4A5654] hover:text-[#0E4D44] transition-colors"
            >
              {isHindi ? 'रिफंड नीति' : 'Refund Policy'}
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
          <span className="text-[#14211F] font-medium">{isHindi ? 'गोपनीयता नीति' : 'Privacy Notice'}</span>
        </div>

        {/* Hero Section */}
        <div className="space-y-3 border-b border-[#E7E3DA] pb-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F4EC] text-[#1F7A4D]">
              <ShieldCheck size={13} />
              <span>{isHindi ? 'डीपीडीपी अधिनियम 2023 अनुपालित' : 'DPDP Act 2023 Compliant'}</span>
            </span>
            <span className="text-xs text-[#7A8582]">
              {isHindi ? 'संस्करण: v1.0 • लागू तिथि: 1 अप्रैल 2026' : 'Version v1.0 • Effective: 1 April 2026'}
            </span>
          </div>

          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#14211F] tracking-tight">
            {isHindi
              ? 'गोपनीयता, डेटा सुरक्षा एवं अभिभावक सहमति नीति'
              : 'Privacy, Data Protection & Parental Consent Policy'}
          </h1>
          <p className="text-sm sm:text-base text-[#4A5654] max-w-2xl leading-relaxed">
            {isHindi
              ? 'डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP Act 2023) के अंतर्गत हमारे संस्थान द्वारा छात्र डेटा का पारदर्शी प्रबंधन, सुरक्षा एवं आपके कानूनी अधिकार।'
              : 'Comprehensive statutory disclosure regarding what personal data we collect for your enrolled child, how it is secured, and your rights under the Digital Personal Data Protection Act, 2023.'}
          </p>
        </div>

        {/* ──────────────────────────────────────────────────────────
            1. WHAT PERSONAL DATA IS STORED (4 CLEAR CARDS)
           ────────────────────────────────────────────────────────── */}
        <section className="space-y-4" aria-label="Personal Data Collected">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-[#0E4D44]" />
            <h2 className="font-serif font-bold text-xl text-[#14211F]">
              {isHindi ? '1. संग्रहीत डेटा (What Data is Collected)' : '1. Personal Data Held for Your Child'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5654]">
            {isHindi
              ? 'FeeDesk केवल कोचिंग शुल्क प्रबंधन और शैक्षणिक मार्गदर्शन के लिए आवश्यक न्यूनतम डेटा रखता है:'
              : 'FeeDesk processes only minimal, purpose-specific records required for tuition fee management, GST tax receipts, and academic welfare:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#E6F0EE] text-[#0E4D44] flex items-center justify-center font-bold text-xs">
                <UserCheck size={16} />
              </div>
              <h3 className="font-semibold text-sm text-[#14211F]">
                {isHindi ? 'अभिभावक संपर्क जानकारी' : 'Guardian Identifiers'}
              </h3>
              <p className="text-xs text-[#4A5654] leading-relaxed">
                {isHindi
                  ? 'पंजीकृत अभिभावक का मोबाइल नंबर (+91), छात्र से संबंध (माता/पिता/अभिभावक), और रिमाइंडर भाषा वरीयता (हिंदी/अंग्रेजी)।'
                  : 'Registered parent phone number (+91), verified parental relationship (Mother/Father/Guardian), and notification language preferences (Hindi/English).'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#E6F0EE] text-[#0E4D44] flex items-center justify-center font-bold text-xs">
                <FileText size={16} />
              </div>
              <h3 className="font-semibold text-sm text-[#14211F]">
                {isHindi ? 'विद्यार्थी प्रोफाइल' : 'Enrolled Student Profile'}
              </h3>
              <p className="text-xs text-[#4A5654] leading-relaxed">
                {isHindi
                  ? 'विद्यार्थी का नाम, विशिष्ट स्टूडेंट आईडी (उदा. STU-0587), नामांकित कोर्स (JEE/NEET), और बैच का विवरण।'
                  : 'Student legal name, unique institute registration ID (e.g. STU-0587), enrolled classroom course (JEE/NEET), and batch schedule.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center font-bold text-xs">
                <ShieldCheck size={16} />
              </div>
              <h3 className="font-semibold text-sm text-[#14211F]">
                {isHindi ? 'शुल्क एवं वित्तीय लेजर' : 'Fee Schedule & GST Invoices'}
              </h3>
              <p className="text-xs text-[#4A5654] leading-relaxed">
                {isHindi
                  ? 'निर्धारित किस्तें, देय तिथियां, प्राप्त भुगतान, बैंक रेफरेंस नंबर, और 18% जीएसटी युक्त आधिकारिक टैक्स रसीदें।'
                  : 'Scheduled instalment amounts, due dates, payment gateway references, scholarship deductions, and official 18% GST tax invoices.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFF4E0] text-[#9A5B0B] flex items-center justify-center font-bold text-xs">
                <Clock size={16} />
              </div>
              <h3 className="font-semibold text-sm text-[#14211F]">
                {isHindi ? 'उपस्थिति एवं शैक्षणिक प्रगति' : 'Academic Attendance & Scores'}
              </h3>
              <p className="text-xs text-[#4A5654] leading-relaxed">
                {isHindi
                  ? 'दैनिक कक्षा उपस्थिति रिकॉर्ड और आवधिक मॉक टेस्ट अंक, जिनका उपयोग छात्र के ड्रॉपआउट जोखिम को समय पर रोकने हेतु होता है।'
                  : 'Daily classroom lecture attendance records and periodic mock test performance marks, used exclusively to ensure academic continuity.'}
              </p>
            </div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            2. PURPOSE LIMITATION (WHAT WE DO VS WHAT WE NEVER DO)
           ────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-sm space-y-5" aria-label="Purpose of Processing">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-[#0E4D44]" />
            <h2 className="font-serif font-bold text-xl text-[#14211F]">
              {isHindi ? '2. डेटा उपयोग का उद्देश्य एवं सुरक्षा' : '2. Purpose Limitation & Data Protection'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Permitted Uses */}
            <div className="space-y-3 bg-[#FAF8F4] p-4 rounded-xl border border-[#E7E3DA]">
              <span className="font-semibold text-xs text-[#1F7A4D] uppercase tracking-wider block">
                {isHindi ? 'स्वीकृत वैधानिक उपयोग' : 'What We Use Your Data For:'}
              </span>
              <ul className="space-y-2 text-[#4A5654]">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-[#1F7A4D] flex-shrink-0 mt-0.5" />
                  <span>{isHindi ? 'आधिकारिक 18% जीएसटी इनवॉइस और रसीदें जारी करना।' : 'Generating legally verified 18% GST tax invoices and receipts.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-[#1F7A4D] flex-shrink-0 mt-0.5" />
                  <span>{isHindi ? 'अभिभावक को देय तिथि से पूर्व स्वचालित एसएमएस रिमाइंडर भेजना।' : 'Sending automated milestone reminders to the parent phone before dues lapse.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-[#1F7A4D] flex-shrink-0 mt-0.5" />
                  <span>{isHindi ? 'अभिभावक पोर्टल पर पारदर्शी लेजर और उपस्थिति रिपोर्ट उपलब्ध कराना।' : 'Providing parents with a private self-service portal for dues and progress.'}</span>
                </li>
              </ul>
            </div>

            {/* Prohibited Uses */}
            <div className="space-y-3 bg-[#FAF8F4] p-4 rounded-xl border border-[#E7E3DA]">
              <span className="font-semibold text-xs text-[#B3261E] uppercase tracking-wider block">
                {isHindi ? 'हम जो कभी नहीं करते' : 'What We NEVER Do (Strict Privacy):'}
              </span>
              <ul className="space-y-2 text-[#4A5654]">
                <li className="flex items-start gap-2">
                  <span className="text-[#B3261E] font-bold text-xs flex-shrink-0">✕</span>
                  <span>{isHindi ? 'किसी भी विज्ञापनदाता या तीसरे पक्ष को फोन नंबर या डेटा नहीं बेचा जाता।' : 'We never sell, rent, or trade parent phone numbers or student data.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#B3261E] font-bold text-xs flex-shrink-0">✕</span>
                  <span>{isHindi ? 'पोर्टल पर कोई तृतीय-पक्ष विज्ञापन या ट्रैकिंग स्क्रिप्ट नहीं लगाई जाती।' : 'We never run third-party advertising, profiling, or behavioral trackers.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#B3261E] font-bold text-xs flex-shrink-0">✕</span>
                  <span>{isHindi ? 'अनावश्यक मार्केटिंग कॉल या प्रमोशनल संदेश नहीं भेजे जाते।' : 'We never dispatch promotional unsolicited marketing phone calls.'}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            3. VERIFIABLE PARENTAL CONSENT UNDER DPDP ACT 2023
           ────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-sm space-y-4" aria-label="Verifiable Parental Consent">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#0E4D44]" />
            <h2 className="font-serif font-bold text-xl text-[#14211F]">
              {isHindi ? '3. अवयस्कों हेतु सत्यापन योग्य अभिभावक सहमति' : '3. Verifiable Parental Consent for Minors'}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#4A5654] leading-relaxed">
            {isHindi
              ? 'चूंकि अधिकांश कोचिंग छात्र 18 वर्ष से कम आयु के अवयस्क हैं, डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP Act 2023) की धारा 9 के तहत माता-पिता की सहमति अनिवार्य है। खाता सक्रियण के समय सिस्टम डिजिटल रूप से निम्न ऑडिट रिकॉर्ड दर्ज करता है:'
              : 'As the majority of coaching students are minors under 18 years of age, Section 9 of the DPDP Act 2023 mandates verifiable parental consent. At initial activation, FeeDesk establishes an immutable audit log:'}
          </p>

          <div className="bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl p-4 font-mono text-xs text-[#14211F] space-y-1">
            <div className="text-[#0E4D44] font-semibold">// Verifiable DPDP Consent Record</div>
            <div>timestamp: &quot;2026-04-01T10:30:00Z&quot;</div>
            <div>policyVersion: &quot;v1.0&quot;</div>
            <div>guardianPhoneVerified: true (6-Digit SMS OTP)</div>
            <div>relationship: &quot;Mother / Father / Guardian&quot;</div>
            <div>purposesAuthorized: [&quot;fee_management&quot;, &quot;gst_invoicing&quot;, &quot;attendance_alerts&quot;]</div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            4. PARENTAL RIGHTS & HOW TO WITHDRAW CONSENT
           ────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-sm space-y-4" aria-label="Parental Rights">
          <div className="flex items-center gap-2">
            <Info size={18} className="text-[#0E4D44]" />
            <h2 className="font-serif font-bold text-xl text-[#14211F]">
              {isHindi ? '4. अभिभावक अधिकार एवं सहमति वापसी' : '4. Parental Rights & Consent Withdrawal'}
            </h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-[#4A5654]">
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#E6F0EE] text-[#0E4D44] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                ✓
              </span>
              <div>
                <strong className="text-[#14211F] block">{isHindi ? 'डेटा पहुंच एवं डाउनलोड:' : 'Right to Access & Download:'}</strong>
                <span>{isHindi ? 'अभिभावक किसी भी समय पैरेंट पोर्टल में लॉगिन करके अपने बच्चे की पूरी फीस रसीदें और उपस्थिति डाउनलोड कर सकते हैं।' : 'Parents can review and download their child’s itemized fee ledger and tax receipts anytime via the self-service portal.'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#E6F0EE] text-[#0E4D44] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                ✓
              </span>
              <div>
                <strong className="text-[#14211F] block">{isHindi ? 'सुधार का अधिकार:' : 'Right to Correction:'}</strong>
                <span>{isHindi ? 'यदि मोबाइल नंबर, नाम या पते में कोई त्रुटि हो, तो सेंटर समन्वयक से संपर्क कर तुरंत सुधार कराया जा सकता है।' : 'Parents have the right to request correction of inaccurate contact numbers, names, or batch records.'}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[#E6F0EE] text-[#0E4D44] font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                ✓
              </span>
              <div>
                <strong className="text-[#14211F] block">{isHindi ? 'सहमति वापस लेना:' : 'Right to Withdraw Consent:'}</strong>
                <span>{isHindi ? 'अभिभावक support@feedesk.demo पर ईमेल करके या सेंटर कार्यालय में लिखित आवेदन देकर सहमति वापस ले सकते हैं। सहमति वापस लेने पर सभी स्वचालित रिमाइंडर तुरंत बंद हो जाते हैं।' : 'Parents may withdraw consent at any time by emailing privacy@feedesk.demo or visiting the Jaipur Centre. Automated SMS reminders cease immediately upon withdrawal.'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            5. DATA RETENTION & RETRIEVAL SCHEDULE
           ────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-sm space-y-4" aria-label="Data Retention Schedule">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#0E4D44]" />
            <h2 className="font-serif font-bold text-xl text-[#14211F]">
              {isHindi ? '5. डेटा प्रतिधारण एवं विलोपन समय-सीमा' : '5. Data Retention & Statutory Erasure Schedule'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl p-4 space-y-1">
              <span className="font-semibold text-xs text-[#0E4D44] block">
                {isHindi ? 'वित्तीय एवं GST रसीद रिकॉर्ड (7 वर्ष)' : 'Financial & GST Ledger (7 Years)'}
              </span>
              <p className="text-[#7A8582]">
                {isHindi
                  ? 'भारतीय आयकर अधिनियम एवं जीएसटी नियमों के अनिवार्य ऑडिट प्रावधानों के तहत वित्तीय रसीदें 7 वर्षों तक सुरक्षित रखी जाती हैं।'
                  : 'Pursuant to statutory Indian accounting and GST audit mandates, invoice numbers and transaction proofs are retained for 7 financial years.'}
              </p>
            </div>

            <div className="bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl p-4 space-y-1">
              <span className="font-semibold text-xs text-[#0E4D44] block">
                {isHindi ? 'शैक्षणिक एवं उपस्थिति डेटा (1 वर्ष)' : 'Academic & Attendance Logs (1 Year)'}
              </span>
              <p className="text-[#7A8582]">
                {isHindi
                  ? 'विद्यार्थी का पाठ्यक्रम पूरा होने के 1 वर्ष पश्चात दैनिक उपस्थिति और टेस्ट रिकॉर्ड स्वतः हटा दिए जाते हैं।'
                  : 'Daily lecture attendance logs and periodic mock test performance marks are permanently purged 1 year after the academic session concludes.'}
              </p>
            </div>
          </div>
        </section>

        {/* ──────────────────────────────────────────────────────────
            6. GRIEVANCE REDRESSAL OFFICER
           ────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-sm space-y-4" aria-label="Grievance Redressal">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-[#0E4D44]" />
            <h2 className="font-serif font-bold text-xl text-[#14211F]">
              {isHindi ? '6. डेटा संरक्षण अधिकारी एवं संपर्क' : '6. Grievance Officer & Official Inquiries'}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#4A5654]">
            {isHindi
              ? 'डीपीडीपी अधिनियम के अंतर्गत किसी भी डेटा या गोपनीयता संबंधी प्रश्न के लिए हमारे अधिकृत अधिकारी से संपर्क करें:'
              : 'For statutory inquiries, consent revocation, or data privacy grievances under the DPDP Act 2023, contact our designated officer:'}
          </p>

          <div className="bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <strong className="text-[#14211F]">{isHindi ? 'पदनाम:' : 'Designation:'}</strong>
              <span className="text-[#4A5654]">Data Protection & Grievance Redressal Officer</span>
            </div>
            <div className="flex items-center gap-2">
              <strong className="text-[#14211F]">{isHindi ? 'ईमेल:' : 'Email:'}</strong>
              <a href="mailto:privacy@feedesk.demo" className="text-[#0E4D44] font-medium hover:underline">
                privacy@feedesk.demo
              </a>
            </div>
            <div className="flex items-center gap-2">
              <strong className="text-[#14211F]">{isHindi ? 'हेल्पलाइन:' : 'Phone:'}</strong>
              <a href="tel:+911412550100" className="text-[#0E4D44] font-medium hover:underline">
                0141-2550100 (Ext. 4)
              </a>
            </div>
            <div className="flex items-start gap-2">
              <strong className="text-[#14211F] flex-shrink-0">{isHindi ? 'कार्यालय:' : 'Address:'}</strong>
              <span className="text-[#4A5654]">Plot 14, Gopalpura Bypass, Tonk Road, Jaipur, Rajasthan 302015</span>
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
            <Link to="/refund-policy" className="hover:text-[#14211F] transition-colors underline-offset-2 hover:underline">
              {isHindi ? 'रिफंड नीति' : 'Refund Policy'}
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
