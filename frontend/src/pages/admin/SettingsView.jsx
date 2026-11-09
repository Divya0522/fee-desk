import { Link } from 'react-router-dom'
import {
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  FileText,
  Percent,
  BellRing,
  Activity,
  KeyRound,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../services/adminApi'
import { useLang } from '../../i18n/useLang'
import { formatPaise } from '../../utils/format'

export default function SettingsView() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'

  const { data: settings, isLoading, error, refetch } = useApi(() => adminApi.getSettings(), [])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-8 w-48 bg-white border border-[#E7E3DA] rounded-xl" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 bg-white border border-[#E7E3DA] rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-12 text-center text-xs text-[#B3261E] bg-white border border-[#B3261E]/30 rounded-2xl space-y-2">
        <AlertCircle size={20} className="mx-auto" />
        <div>Failed to load settings: {error.message}</div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E4D44] text-white text-xs font-semibold"
        >
          <RefreshCw size={12} />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  const refund = settings?.refundPolicy || {}
  const taxation = settings?.taxation || {}
  const reminders = settings?.reminders || {}
  const risk = settings?.riskScoring || {}
  const authSettings = settings?.authentication || {}

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          HEADER
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
            {isHindi ? 'सिस्टम सेटिंग्स (केवल-पठन)' : 'System Settings & Policies'}
          </h1>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1 font-medium">
            {isHindi
              ? 'वैधानिक नीतियां, जीएसटी दरें, स्वचालन पैरामीटर और सुरक्षा सीमाएं'
              : 'Governing policies, taxation rates, automation offsets, and security rules.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-semibold text-[#4A5654] transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin text-[#0E4D44]' : ''} />
          <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
          READ-ONLY NOTICE BANNER
         ────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#E6F0EE] border border-[#0E4D44]/20 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-[#0E4D44] shrink-0 mt-0.5" />
          <div className="text-xs text-[#0E4D44]">
            <strong className="text-sm font-semibold">Single Source of Truth Configuration</strong>
            <p className="mt-0.5 opacity-90 leading-relaxed">
              {isHindi
                ? 'ये मान कोड में निर्धारित हैं और यहां संपादन योग्य नहीं हैं। किसी भी परिवर्तन के लिए संस्करण नियंत्रण और नीति अनुमोदन की आवश्यकता होती है।'
                : 'These values are set in code and are not editable here. Any modifications require policy governance review and code deployment.'}
            </p>
          </div>
        </div>

        <Link
          to="/refund-policy"
          target="_blank"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-[#0E4D44] border border-[#0E4D44]/30 text-xs font-semibold hover:bg-[#FAF8F4] transition-colors shrink-0 shadow-xs"
        >
          <span>Public Policy</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION 1: REFUND POLICY (v1.0)
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] text-[#0E4D44] flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-[#14211F]">
                FeeDesk Published Refund Policy
              </h2>
              <div className="text-[11px] text-[#7A8582]">
                Policy Version: <strong className="text-[#14211F]">{refund.version}</strong> • Effective: {refund.effectiveFrom}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F4EC] text-[#1F7A4D]">
            Statutory Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA]">
            <div className="text-[11px] text-[#7A8582]">Registration Retention</div>
            <div className="font-serif font-bold text-base text-[#14211F] mt-1">
              {refund.deductionRatePercent}% (capped at {formatPaise(refund.deductionCapPaise)})
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA]">
            <div className="text-[11px] text-[#7A8582]">Pro-Rata Basis</div>
            <div className="font-serif font-bold text-base text-[#14211F] mt-1 capitalize">
              {refund.proRataBasis?.replace('_', ' ')}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA]">
            <div className="text-[11px] text-[#7A8582]">Mandatory Payout SLA</div>
            <div className="font-serif font-bold text-base text-[#14211F] mt-1">
              {refund.payoutLimitDays} Calendar Days
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-[#14211F]">Statutory Rules Enforced by Engine:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {(refund.rules || []).map((rule, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-[#4A5654] leading-relaxed">
                {rule}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION 2: TAXATION & GST
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7E3DA]">
          <div className="w-8 h-8 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] text-[#0E4D44] flex items-center justify-center">
            <Percent size={16} />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base text-[#14211F]">
              Goods & Services Tax (GST) Configuration
            </h2>
            <div className="text-[11px] text-[#7A8582]">
              Tax Invoice and Credit Note Statutory Compliance
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#14211F]">GST Rate on Coaching Services</div>
              <div className="text-[11px] text-[#7A8582]">CGST 9% + SGST 9% under SAC 999293</div>
            </div>
            <div className="font-serif font-bold text-xl text-[#0E4D44] tabular-nums">
              {taxation.gstRatePercent}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-between">
            <div>
              <div className="font-semibold text-[#14211F]">Quoted Fees Format</div>
              <div className="text-[11px] text-[#7A8582]">Display price inclusive of all applicable taxes</div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-[#E8F4EC] text-[#1F7A4D] font-bold text-[11px]">
              Inclusive
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION 3: REMINDERS & AUTOMATION CADENCE
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7E3DA]">
          <div className="w-8 h-8 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] text-[#0E4D44] flex items-center justify-center">
            <BellRing size={16} />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base text-[#14211F]">
              Reminder Schedule & Offsets
            </h2>
            <div className="text-[11px] text-[#7A8582]">
              Automatic dispatches across SMS and WhatsApp
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="text-[11px] font-semibold text-[#7A8582] uppercase tracking-wider">
            Evaluation Cadence Points
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {(reminders.offsets || []).map((offset, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-center">
                <div className="font-semibold text-[#14211F]">{offset}</div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#E8F4EC] border border-[#1F7A4D]/20 text-[11px] text-[#1F7A4D]">
            <strong>Immediate Halt Trigger:</strong> Reminders stop automatically the moment a payment receipt is recorded in the system.
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION 4: DROPOUT RISK SCORING RULES
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7E3DA]">
          <div className="w-8 h-8 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] text-[#0E4D44] flex items-center justify-center">
            <Activity size={16} />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base text-[#14211F]">
              Dropout Risk Scoring Engine Rules
            </h2>
            <div className="text-[11px] text-[#7A8582]">
              Point weights for automated academic & financial signal detection
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {(risk.factors || []).map((factor, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-between">
              <span className="font-medium text-[#14211F]">{factor.rule}</span>
              <span className="font-serif font-bold text-sm text-[#D98A1E] tabular-nums">
                +{factor.points} pts
              </span>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-[#7A8582] italic">
          Operational Constraint: {risk.actionPolicy}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          SECTION 5: AUTHENTICATION & SECURITY LIMITS
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E7E3DA]">
          <div className="w-8 h-8 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] text-[#0E4D44] flex items-center justify-center">
            <KeyRound size={16} />
          </div>
          <div>
            <h2 className="font-serif font-bold text-base text-[#14211F]">
              Authentication & Anti-Abuse Controls
            </h2>
            <div className="text-[11px] text-[#7A8582]">
              OTP rate limits and password complexity parameters
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA]">
            <div className="text-[10px] text-[#7A8582]">OTP Expiry Window</div>
            <div className="font-serif font-bold text-base text-[#14211F] mt-1 tabular-nums">
              {authSettings.otpExpiryMinutes} minutes
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA]">
            <div className="text-[10px] text-[#7A8582]">Max Failed Attempts</div>
            <div className="font-serif font-bold text-base text-[#14211F] mt-1 tabular-nums">
              {authSettings.maxOtpVerificationAttempts} attempts
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA]">
            <div className="text-[10px] text-[#7A8582]">Lockout Duration</div>
            <div className="font-serif font-bold text-base text-[#14211F] mt-1 tabular-nums">
              {authSettings.accountLockoutMinutes} minutes
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA]">
            <div className="text-[10px] text-[#7A8582]">Password Min Length</div>
            <div className="font-serif font-bold text-base text-[#14211F] mt-1 tabular-nums">
              {authSettings.passwordMinLength} characters
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
