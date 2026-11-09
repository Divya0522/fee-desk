import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  ChevronRight, 
  RefreshCw, 
  ShieldCheck, 
  CreditCard, 
  Bell, 
  MessageSquare, 
  Check, 
  HelpCircle, 
  Phone, 
  FileText, 
  ArrowRight 
} from 'lucide-react'
import { useLang } from '../../i18n/useLang'
import { formatPaise, formatDate } from '../../utils/format'
import * as parentApi from '../../services/parentApi'
import PaymentModal from './PaymentModal'

export default function DuesView() {
  const { lang, t } = useLang()
  const isHindi = lang === 'hi'
  const pt = t.portal?.dues || {}
  const notifT = t.portal?.notifications || {}

  const { activeStudent, selectedStudentId, isLoadingStudents } = useOutletContext()

  const [ledger, setLedger] = useState(null)
  const [reminders, setReminders] = useState([])
  const [isLoadingLedger, setIsLoadingLedger] = useState(true)
  const [ledgerError, setLedgerError] = useState(null)
  
  // Payment modal state
  const [selectedInstalmentForPay, setSelectedInstalmentForPay] = useState(null)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)

  // Fetch student ledger and reminders (support silent background refetch)
  const fetchLedger = async (silent = false) => {
    if (!selectedStudentId) return
    try {
      if (!silent) setIsLoadingLedger(true)
      setLedgerError(null)

      const [ledgerRes, remindersRes] = await Promise.all([
        parentApi.getStudentLedger(selectedStudentId),
        parentApi.getStudentReminders(selectedStudentId).catch(() => []),
      ])

      setLedger(ledgerRes)
      setReminders(Array.isArray(remindersRes) ? remindersRes : remindersRes?.reminders || [])
    } catch (err) {
      if (!silent) setLedgerError(err.message || 'Unable to load fee ledger.')
    } finally {
      if (!silent) setIsLoadingLedger(false)
    }
  }

  useEffect(() => {
    fetchLedger(false)
  }, [selectedStudentId])

  // Derive dues calculations
  const instalments = ledger?.instalments || []
  const unpaidInstalments = instalments.filter((i) => (i.balancePaise || 0) > 0)
  const overdueInstalments = instalments.filter((i) => i.status === 'overdue' && (i.balancePaise || 0) > 0)
  
  // Earliest unpaid instalment is shown in hero fold
  const earliestUnpaid = unpaidInstalments[0] || null

  // Status chip for hero fold
  const getHeroStatusChip = () => {
    if (!earliestUnpaid) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F4EC] text-[#1F7A4D]">
          <CheckCircle2 size={14} strokeWidth={2} />
          <span>{pt.allPaid || 'All paid'}</span>
        </span>
      )
    }

    if (earliestUnpaid.status === 'overdue') {
      const daysText = isHindi 
        ? `${earliestUnpaid.daysOverdue || 1} दिन अतिदेय`
        : `${earliestUnpaid.daysOverdue || 1} days overdue`
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FDECEA] text-[#B3261E]">
          <AlertCircle size={14} strokeWidth={2} />
          <span>{daysText}</span>
        </span>
      )
    }

    // Due soon or upcoming
    const dueSoonDays = Math.max(0, Math.ceil((new Date(earliestUnpaid.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    const dueSoonText = isHindi 
      ? `शेष ${dueSoonDays} दिन`
      : `Due in ${dueSoonDays} days`
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF4E0] text-[#9A5B0B]">
        <Clock size={14} strokeWidth={2} />
        <span>{dueSoonText}</span>
      </span>
    )
  }

  // Row status chip helper
  const renderRowStatusChip = (inst) => {
    if (inst.status === 'paid' || (inst.balancePaise === 0 && inst.paidPaise > 0)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F4EC] text-[#1F7A4D]">
          <CheckCircle2 size={12} strokeWidth={2} />
          <span>{isHindi ? 'जमा' : 'Paid'}</span>
        </span>
      )
    }
    if (inst.status === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FDECEA] text-[#B3261E]">
          <AlertCircle size={12} strokeWidth={2} />
          <span>{isHindi ? 'अतिदेय' : 'Overdue'}</span>
        </span>
      )
    }
    if (inst.status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF4E0] text-[#9A5B0B]">
          <Clock size={12} strokeWidth={2} />
          <span>{isHindi ? 'आंशिक' : 'Partial'}</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FAF8F4] text-[#7A8582] border border-[#E7E3DA]">
        <span>{isHindi ? 'आगामी' : 'Upcoming'}</span>
      </span>
    )
  }

  const handleOpenPay = (inst) => {
    if (!inst || (inst.balancePaise || 0) <= 0) return
    setSelectedInstalmentForPay(inst)
    setIsPayModalOpen(true)
  }

  // Silent update so payment modal remains visible until parent dismisses
  const handlePaymentSuccess = () => {
    fetchLedger(true)
  }

  const handleClosePayModal = () => {
    setIsPayModalOpen(false)
    setSelectedInstalmentForPay(null)
    fetchLedger(true)
  }

  // Skeleton loading state
  if (isLoadingStudents || isLoadingLedger) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading fee details">
        {/* Hero Card Skeleton */}
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 space-y-4">
          <div className="h-4 bg-[#E7E3DA]/60 rounded w-1/3" />
          <div className="h-3 bg-[#E7E3DA]/40 rounded w-1/4" />
          <div className="h-12 bg-[#E7E3DA]/70 rounded w-1/2" />
          <div className="h-5 bg-[#E7E3DA]/40 rounded w-2/5" />
          <div className="h-14 bg-[#E7E3DA]/80 rounded-xl w-full" />
        </div>

        {/* Schedule Skeleton */}
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 space-y-3">
          <div className="h-6 bg-[#E7E3DA]/60 rounded w-1/4 mb-4" />
          <div className="h-14 bg-[#E7E3DA]/30 rounded-xl" />
          <div className="h-14 bg-[#E7E3DA]/30 rounded-xl" />
          <div className="h-14 bg-[#E7E3DA]/30 rounded-xl" />
        </div>
      </div>
    )
  }

  if (ledgerError) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#FDECEA] text-[#B3261E] flex items-center justify-center">
          <AlertCircle size={24} />
        </div>
        <div>
          <h3 className="font-serif font-semibold text-lg text-[#14211F]">Unable to load fee ledger</h3>
          <p className="text-sm text-[#7A8582] mt-1">{ledgerError}</p>
        </div>
        <button
          type="button"
          onClick={fetchLedger}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E4D44] text-[#FAF8F4] text-sm font-medium hover:bg-[#0A3B34] transition-colors"
        >
          <RefreshCw size={15} />
          <span>Retry</span>
        </button>
      </div>
    )
  }

  const studentName = activeStudent?.name || ledger?.student?.name || 'Student'
  const studentBatch = activeStudent?.batch || ledger?.student?.batch || 'Coaching Batch'
  const centreName = activeStudent?.centre || ledger?.student?.centre || 'Jaipur Main Centre'

  const heroAmountPaise = earliestUnpaid ? (earliestUnpaid.balancePaise || 0) : 0
  const heroDueDate = earliestUnpaid?.dueDate || null

  const totalOverduePaise = overdueInstalments.reduce((sum, inst) => sum + (inst.balancePaise || 0), 0)
  const hasMultipleOverdue = overdueInstalments.length > 1

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────
          SCREEN 1: THE 5-SECOND HERO FOLD (Above the fold at 360x640)
          Child name + batch, Amount due label, 44px Fraunces numerals,
          Due date, Status chip, Full-width 56px green "Pay now" button.
         ────────────────────────────────────────────────────────── */}
      <section 
        className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-sm space-y-4"
        aria-label="Fee dues overview"
      >
        {/* Child name + batch (small) */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="font-medium text-xs sm:text-sm text-[#4A5654] truncate">
              {studentName} <span className="text-[#7A8582]">• {studentBatch}</span>
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#7A8582] bg-[#FAF8F4] px-2 py-0.5 rounded border border-[#E7E3DA] flex-shrink-0">
            {activeStudent?.studentId}
          </span>
        </div>

        {/* Amount due label & 44px Fraunces amount */}
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-[#7A8582] block mb-1">
            {pt.amountDue || 'Amount due'}
          </span>
          <div className="font-serif font-bold text-[2.75rem] leading-none text-[#14211F] tracking-tight tabular-nums">
            {formatPaise(heroAmountPaise)}
          </div>
        </div>

        {/* Due date and Status chip row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E7E3DA]/60">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#4A5654]">
            <Calendar size={15} className="text-[#7A8582]" />
            <span>
              {heroDueDate ? (
                <>
                  <span className="text-[#7A8582]">{pt.dueOn || 'Due'}: </span>
                  <strong className="font-medium text-[#14211F] tabular-nums">{formatDate(heroDueDate, lang)}</strong>
                </>
              ) : (
                <span className="text-[#1F7A4D] font-medium">{pt.noDues || 'All instalments settled'}</span>
              )}
            </span>
          </div>

          {/* Status chip */}
          {getHeroStatusChip()}
        </div>

        {/* Quiet line if multiple overdue */}
        {hasMultipleOverdue && (
          <div className="text-xs text-[#B3261E] bg-[#FDECEA]/60 px-3 py-1.5 rounded-lg border border-[#B3261E]/20">
            {pt.totalOverdueNotice 
              ? pt.totalOverdueNotice.replace('{count}', overdueInstalments.length).replace('{amount}', formatPaise(totalOverduePaise))
              : `Total overdue across ${overdueInstalments.length} instalments: ${formatPaise(totalOverduePaise)}`}
          </div>
        )}

        {/* Full-width 56px Green "Pay now" Button */}
        <div>
          {earliestUnpaid ? (
            <button
              type="button"
              onClick={() => handleOpenPay(earliestUnpaid)}
              className="w-full h-14 bg-[#0E4D44] hover:bg-[#0A3B34] active:bg-[#082D27] text-[#FAF8F4] rounded-xl font-medium text-base shadow-sm flex items-center justify-center gap-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4D44] focus-visible:ring-offset-2"
            >
              <CreditCard size={18} strokeWidth={2} />
              <span>
                {pt.payNow || 'Pay now'} ({formatPaise(heroAmountPaise)})
              </span>
            </button>
          ) : (
            <div className="w-full h-14 bg-[#E8F4EC] text-[#1F7A4D] rounded-xl font-medium text-sm flex items-center justify-center gap-2 border border-[#1F7A4D]/20">
              <CheckCircle2 size={18} strokeWidth={2} />
              <span>{pt.noDues || 'All scheduled instalments settled'}</span>
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          AUTOMATED SMS REMINDER NOTIFICATIONS STATUS
          Overdue: sends SMS every 3 days until paid; cancels immediately upon payment.
         ────────────────────────────────────────────────────────── */}
      <section 
        className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition-colors ${
          overdueInstalments.length > 0
            ? 'bg-[#FFFBEB] border-[#D98A1E]/30 text-[#14211F]'
            : earliestUnpaid
            ? 'bg-white border-[#E7E3DA] text-[#4A5654]'
            : 'bg-[#E8F4EC] border-[#1F7A4D]/20 text-[#1F7A4D]'
        }`}
        aria-label="SMS Reminders and Notifications status"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              overdueInstalments.length > 0 ? 'bg-[#D98A1E]/15 text-[#9A5B0B]' : earliestUnpaid ? 'bg-[#E6F0EE] text-[#0E4D44]' : 'bg-[#E8F4EC] text-[#1F7A4D]'
            }`}>
              {overdueInstalments.length > 0 ? <Bell size={16} /> : earliestUnpaid ? <MessageSquare size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm">
                {overdueInstalments.length > 0
                  ? notifT.activeRemindersTitle || 'Automated SMS Reminders Active'
                  : earliestUnpaid
                  ? 'Upcoming Reminder Alert'
                  : 'Automated Reminders Stopped'}
              </h3>
              <p className="text-xs text-[#7A8582] mt-0.5">
                {overdueInstalments.length > 0
                  ? notifT.activeRemindersText || 'Automated SMS reminders are dispatched every 3 days until this overdue instalment is settled. All reminders stop automatically immediately upon payment.'
                  : earliestUnpaid
                  ? notifT.upcomingRemindersText || 'Automated SMS reminder scheduled 3 days before the due date.'
                  : notifT.allSettledRemindersText || 'All instalments settled. Automated reminder notices are inactive.'}
              </p>
            </div>
          </div>

          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded whitespace-nowrap ${
            overdueInstalments.length > 0 ? 'bg-[#D98A1E]/20 text-[#9A5B0B]' : earliestUnpaid ? 'bg-[#E6F0EE] text-[#0E4D44]' : 'bg-[#1F7A4D]/15 text-[#1F7A4D]'
          }`}>
            {overdueInstalments.length > 0 ? 'Every 3 Days' : earliestUnpaid ? 'Scheduled' : 'Stopped'}
          </span>
        </div>

        {/* Recent SMS logs list if any */}
        {reminders.length > 0 && (
          <div className="border-t border-[#E7E3DA] pt-2.5 space-y-1.5">
            <span className="text-[11px] font-semibold text-[#7A8582] uppercase tracking-wider block">
              Recent SMS Activity:
            </span>
            <div className="space-y-1">
              {reminders.slice(0, 2).map((rem, idx) => (
                <div key={rem._id || idx} className="text-xs flex items-center justify-between py-1 bg-white/70 px-2.5 rounded-lg border border-[#E7E3DA]/60">
                  <span className="text-[#4A5654] truncate max-w-[280px]">
                    {rem.messagePreview || `FeeDesk Reminder: Instalment #${rem.sequence} due`}
                  </span>
                  <span className={`text-[11px] font-medium ml-2 ${
                    rem.status === 'sent' ? 'text-[#1F7A4D]' : rem.status === 'skipped_paid' ? 'text-[#0E4D44]' : 'text-[#9A5B0B]'
                  }`}>
                    {rem.status === 'sent' ? 'Sent' : rem.status === 'skipped_paid' ? 'Stopped (Paid)' : 'Scheduled'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────
          BELOW THE FOLD: FULL FEE SCHEDULE LIST
          Instalment 1, 2, 3... with due date, amount, paid amount, status chip.
          Tapping an unpaid row opens the pay action for that instalment.
         ────────────────────────────────────────────────────────── */}
      <section 
        className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-sm space-y-4"
        aria-label="Fee schedule details"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-semibold text-lg text-[#14211F]">
            {pt.scheduleTitle || 'Fee schedule'}
          </h3>
          <span className="text-xs text-[#7A8582]">
            {ledger?.plan?.netPayablePaise ? `Total: ${formatPaise(ledger.plan.netPayablePaise)}` : ''}
          </span>
        </div>

        {/* Fee Schedule Rows */}
        <div className="divide-y divide-[#E7E3DA] border border-[#E7E3DA] rounded-xl overflow-hidden">
          {instalments.map((inst) => {
            const isUnpaid = (inst.balancePaise || 0) > 0
            const rowClass = isUnpaid 
              ? 'hover:bg-[#FAF8F4] cursor-pointer transition-colors' 
              : 'bg-white'

            return (
              <div
                key={inst._id || inst.sequence}
                onClick={isUnpaid ? () => handleOpenPay(inst) : undefined}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${rowClass}`}
                role={isUnpaid ? 'button' : undefined}
                tabIndex={isUnpaid ? 0 : undefined}
                onKeyDown={isUnpaid ? (e) => e.key === 'Enter' && handleOpenPay(inst) : undefined}
                aria-label={`Instalment ${inst.sequence}, amount ${formatPaise(inst.amountPaise)}`}
              >
                {/* Left: Sequence + Due Date */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[#14211F]">
                      {pt.sequence || 'Instalment'} {inst.sequence}
                    </span>
                    {renderRowStatusChip(inst)}
                  </div>
                  <div className="text-xs text-[#7A8582] flex items-center gap-1.5 tabular-nums">
                    <Calendar size={13} />
                    <span>{pt.dueDate || 'Due'}: {formatDate(inst.dueDate, lang)}</span>
                  </div>
                </div>

                {/* Right: Amounts & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                  <div>
                    <div className="font-serif font-semibold text-base text-[#14211F] tabular-nums">
                      {formatPaise(inst.amountPaise)}
                    </div>
                    <div className="text-xs text-[#7A8582] tabular-nums">
                      {isUnpaid ? (
                        <span className="text-[#B3261E] font-medium">
                          {isHindi ? 'बकाया' : 'Balance'}: {formatPaise(inst.balancePaise)}
                        </span>
                      ) : (
                        <span className="text-[#1F7A4D]">
                          {isHindi ? 'जमा' : 'Paid'}: {formatPaise(inst.paidPaise)}
                        </span>
                      )}
                    </div>
                  </div>

                  {isUnpaid && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenPay(inst)
                      }}
                      className="px-3 py-1.5 bg-[#FAF8F4] hover:bg-[#0E4D44] text-[#0E4D44] hover:text-[#FAF8F4] border border-[#0E4D44]/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <span>{pt.payAmount || 'Pay'}</span>
                      <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-2 text-center text-xs text-[#7A8582]">
          {pt.tapToPay || 'Tapping an unpaid row opens the pay action for that instalment.'}
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          CENTRE SUPPORT, REFUND POLICY & PRIVACY QUICK ACCESS
         ────────────────────────────────────────────────────────── */}
      <section 
        className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-sm space-y-4"
        aria-label="Centre support and policies"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif font-semibold text-lg text-[#14211F] flex items-center gap-2">
              <HelpCircle size={18} className="text-[#0E4D44]" />
              <span>{isHindi ? 'सेंटर सहायता, रिफंड एवं नीतियां' : 'Centre Support, Refunds & Policies'}</span>
            </h3>
            <p className="text-xs text-[#7A8582] mt-0.5">
              {isHindi ? 'जयपुर कोचिंग सेंटर संपर्क, आधिकारिक फीस रिफंड नियम एवं डेटा गोपनीयता' : 'Jaipur Coaching Centre helpline, official fee refund terms & data privacy'}
            </p>
          </div>

          <Link
            to={selectedStudentId ? `/portal/support?student=${selectedStudentId}` : '/portal/support'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E4D44] hover:underline underline-offset-2 whitespace-nowrap self-start sm:self-auto"
          >
            <span>{isHindi ? 'सभी नीतियां देखें' : 'View all policies'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* 3 Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <a
            href="tel:+911412550100"
            className="p-3.5 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] hover:border-[#0E4D44] hover:bg-white transition-all group block text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#E6F0EE] text-[#0E4D44] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Phone size={15} />
            </div>
            <span className="font-semibold text-xs text-[#14211F] block">
              {isHindi ? 'सेंटर हेल्पलाइन' : 'Call Helpline'}
            </span>
            <span className="text-[11px] text-[#7A8582] block mt-0.5">
              0141-2550100 (Mon–Sat)
            </span>
          </a>

          <Link
            to="/refund-policy"
            className="p-3.5 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] hover:border-[#0E4D44] hover:bg-white transition-all group block text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText size={15} />
            </div>
            <span className="font-semibold text-xs text-[#14211F] block">
              {isHindi ? 'फीस रिफंड नीति' : 'Refund Policy'}
            </span>
            <span className="text-[11px] text-[#7A8582] block mt-0.5">
              {isHindi ? '100% रिफंड (15 दिन)' : '100% refund in 15 days'}
            </span>
          </Link>

          <Link
            to="/privacy"
            className="p-3.5 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] hover:border-[#0E4D44] hover:bg-white transition-all group block text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#E6F0EE] text-[#0E4D44] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <ShieldCheck size={15} />
            </div>
            <span className="font-semibold text-xs text-[#14211F] block">
              {isHindi ? 'डेटा प्राइवेसी' : 'Privacy & Consent'}
            </span>
            <span className="text-[11px] text-[#7A8582] block mt-0.5">
              DPDP Act 2023 Compliant
            </span>
          </Link>
        </div>
      </section>

      {/* Payment Action Modal / Bottom Sheet */}
      {selectedInstalmentForPay && (
        <PaymentModal
          isOpen={isPayModalOpen}
          onClose={handleClosePayModal}
          instalment={selectedInstalmentForPay}
          student={activeStudent || ledger?.student}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
