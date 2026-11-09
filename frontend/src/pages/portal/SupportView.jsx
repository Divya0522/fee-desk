import { Link, useOutletContext } from 'react-router-dom'
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight, 
  FileText, 
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { useLang } from '../../i18n/useLang'

export default function SupportView() {
  const { lang, t } = useLang()
  const isHindi = lang === 'hi'
  const st = t.portal?.support || {}
  const { activeStudent } = useOutletContext()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="font-serif font-bold text-2xl text-[#14211F]">
          {st.title || 'Support & Policies'}
        </h2>
        <p className="text-xs sm:text-sm text-[#7A8582] mt-0.5">
          {st.subtitle || 'Centre contact details, official refund policy, and data privacy notice.'}
        </p>
      </div>

      {/* ──────────────────────────────────────────────────────────
          1. DIRECT CENTRE CONTACT & HELPDESK
         ────────────────────────────────────────────────────────── */}
      <section 
        className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-sm space-y-5"
        aria-label="Centre contact details"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E3DA] pb-4">
          <div>
            <h3 className="font-serif font-semibold text-lg text-[#14211F]">
              {st.contactTitle || 'Jaipur Main Centre Support'}
            </h3>
            <p className="text-xs text-[#7A8582] mt-0.5 flex items-center gap-1.5">
              <Clock size={13} />
              <span>{st.contactSubtitle || 'Available Monday to Saturday, 9:00 AM – 7:00 PM'}</span>
            </p>
          </div>

          {activeStudent && (
            <div className="text-left sm:text-right text-xs">
              <span className="text-[#7A8582] block">{st.studentCoordinator || 'Student Coordinator'}</span>
              <span className="font-semibold text-[#0E4D44]">{activeStudent.name} • {activeStudent.batch}</span>
            </div>
          )}
        </div>

        {/* Quick Contact Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="tel:+911412550100"
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-[#FAF8F4] font-medium text-xs sm:text-sm transition-colors shadow-sm"
          >
            <Phone size={15} />
            <span>{st.callCentre || 'Call Helpline'}</span>
          </a>

          <a
            href="https://wa.me/919829012345"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#FAF8F4] hover:bg-[#E6F0EE] text-[#0E4D44] border border-[#0E4D44]/25 font-medium text-xs sm:text-sm transition-colors"
          >
            <MessageSquare size={15} />
            <span>{st.whatsappSupport || 'WhatsApp Helpdesk'}</span>
          </a>

          <a
            href="mailto:support@feedesk.demo"
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#FAF8F4] hover:bg-[#E6F0EE] text-[#4A5654] border border-[#E7E3DA] font-medium text-xs sm:text-sm transition-colors"
          >
            <Mail size={15} />
            <span>{st.emailSupport || 'Email Support'}</span>
          </a>
        </div>

        {/* Physical Address */}
        <div className="bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl p-3.5 flex items-start gap-3 text-xs">
          <MapPin size={16} className="text-[#0E4D44] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#14211F] block">{st.centreAddressLabel || 'Physical Address'}:</span>
            <p className="text-[#4A5654] mt-0.5">
              {st.centreAddress || 'Plot 14, Gopalpura Bypass, Tonk Road, Jaipur, Rajasthan 302015'}
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          2. OFFICIAL FEE REFUND POLICY (Prominent & Clear)
         ────────────────────────────────────────────────────────── */}
      <section 
        className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-sm space-y-4"
        aria-label="Fee refund terms"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-semibold text-lg text-[#14211F]">
              {st.refundTitle || 'Official Fee Refund Policy'}
            </h3>
            <p className="text-xs text-[#7A8582] mt-0.5">
              {st.refundSubtitle || 'Transparent cancellation and refund terms for classroom programs'}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#E6F0EE] text-[#0E4D44] text-xs font-semibold whitespace-nowrap">
            Jaipur Centre Standard
          </span>
        </div>

        {/* Refund Timeline Table */}
        <div className="border border-[#E7E3DA] rounded-xl overflow-hidden divide-y divide-[#E7E3DA] text-xs">
          <div className="p-3.5 flex items-start gap-3 bg-[#FAF8F4]">
            <span className="w-6 h-6 rounded-full bg-[#E8F4EC] text-[#1F7A4D] font-bold text-xs flex items-center justify-center flex-shrink-0">
              1
            </span>
            <div className="flex-1">
              <strong className="text-[#14211F] block">Days 1 – 15: 100% Tuition Fee Refund</strong>
              <span className="text-[#7A8582]">
                Full refund of tuition fees within 15 calendar days from the scheduled batch commencement date (registration fee retained).
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E8F4EC] text-[#1F7A4D] whitespace-nowrap">
              100% Refund
            </span>
          </div>

          <div className="p-3.5 flex items-start gap-3 bg-white">
            <span className="w-6 h-6 rounded-full bg-[#FFF4E0] text-[#9A5B0B] font-bold text-xs flex items-center justify-center flex-shrink-0">
              2
            </span>
            <div className="flex-1">
              <strong className="text-[#14211F] block">Days 16 – 30: 50% Tuition Fee Refund</strong>
              <span className="text-[#7A8582]">
                50% refund of tuition fees if withdrawal application is submitted between day 16 and day 30.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFF4E0] text-[#9A5B0B] whitespace-nowrap">
              50% Refund
            </span>
          </div>

          <div className="p-3.5 flex items-start gap-3 bg-white">
            <span className="w-6 h-6 rounded-full bg-[#FDECEA] text-[#B3261E] font-bold text-xs flex items-center justify-center flex-shrink-0">
              3
            </span>
            <div className="flex-1">
              <strong className="text-[#14211F] block">After 30 Days: Non-refundable</strong>
              <span className="text-[#7A8582]">
                No refunds permitted after 30 days as batch seats, study material, and teacher allocation are finalized.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FDECEA] text-[#B3261E] whitespace-nowrap">
              Non-refundable
            </span>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between">
          <Link
            to="/refund-policy"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E4D44] hover:underline underline-offset-2"
          >
            <span>{st.viewFullRefundPolicy || 'Read full refund policy'}</span>
            <ArrowRight size={13} />
          </Link>
          <span className="text-[11px] text-[#7A8582]">Processed within 7 business days</span>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          3. PRIVACY & DATA PROTECTION (DPDP Act 2023)
         ────────────────────────────────────────────────────────── */}
      <section 
        className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-sm space-y-4"
        aria-label="Data privacy terms"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-semibold text-lg text-[#14211F]">
              {st.privacyTitle || 'Privacy & Data Protection (DPDP Act 2023)'}
            </h3>
            <p className="text-xs text-[#7A8582] mt-0.5">
              {st.privacySubtitle || "How your child's fee, attendance, and performance records are protected"}
            </p>
          </div>
          <span className="p-1.5 rounded-lg bg-[#E6F0EE] text-[#0E4D44]">
            <ShieldCheck size={18} />
          </span>
        </div>

        <div className="bg-[#FAF8F4] border border-[#E7E3DA] rounded-xl p-4 text-xs space-y-2.5">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E4D44] mt-1.5 flex-shrink-0" />
            <p className="text-[#4A5654]">
              <strong>Consent-Driven:</strong> FeeDesk records only verifiable student details (ID, phone, attendance, test scores, fee instalments) under explicit parental consent under the Digital Personal Data Protection Act 2023.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E4D44] mt-1.5 flex-shrink-0" />
            <p className="text-[#4A5654]">
              <strong>Strict Privacy:</strong> Your phone number and student performance data are strictly confidential and never sold, rented, or shared with third-party advertisers.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0E4D44] mt-1.5 flex-shrink-0" />
            <p className="text-[#4A5654]">
              <strong>Consent Withdrawal:</strong> Parents may withdraw consent or request record deletion at any time by written application to the centre administrator.
            </p>
          </div>
        </div>

        <div className="pt-1">
          <Link
            to="/privacy"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E4D44] hover:underline underline-offset-2"
          >
            <span>{st.viewFullPrivacyPolicy || 'Read full privacy policy'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          4. FREQUENTLY ASKED QUESTIONS
         ────────────────────────────────────────────────────────── */}
      <section 
        className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-sm space-y-4"
        aria-label="Parent FAQs"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-[#0E4D44]" />
          <h3 className="font-serif font-semibold text-lg text-[#14211F]">
            {st.faqTitle || 'Frequently Asked Questions'}
          </h3>
        </div>

        <div className="divide-y divide-[#E7E3DA] border border-[#E7E3DA] rounded-xl overflow-hidden text-xs">
          {(st.faqs || []).map((faq, idx) => (
            <div key={idx} className="p-4 space-y-1.5 bg-white">
              <span className="font-semibold text-sm text-[#14211F] block">
                {faq.q}
              </span>
              <p className="text-[#4A5654] leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
