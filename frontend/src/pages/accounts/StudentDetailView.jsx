import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Eye,
  EyeOff,
  Copy,
  Check,
  CreditCard,
  RotateCcw,
  AlertTriangle,
  Bell,
  FileText,
  DollarSign,
  Printer,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/useAuth'
import * as staffApi from '../../services/staffApi'
import { formatPaise, formatDate, formatDaysOverdue, maskPhone, formatReminderOffset } from '../../utils/format'
import StatusChip from '../../components/common/StatusChip'
import { useLang } from '../../i18n/useLang'

export default function StudentDetailView() {
  const { studentId } = useParams()
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const navigate = useNavigate()
  const { showToast } = useAuth()

  // Active Tab
  const [activeTab, setActiveTab] = useState('instalments') // 'instalments' | 'payments' | 'reminders' | 'risk' | 'refund'

  // Phone Reveal 10s Timer State
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [revealCountdown, setRevealCountdown] = useState(0)

  // Copied Link State
  const [copiedInstalmentId, setCopiedInstalmentId] = useState(null)

  // Payment Recording Modal State
  const [payingInstalment, setPayingInstalment] = useState(null)
  const [payAmountRupees, setPayAmountRupees] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payReference, setPayReference] = useState('')
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(null)

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState(null)

  // Fetch Student Detail
  const { data: student, isLoading, refetch, error } = useApi(
    () => staffApi.getStudentDetail(studentId),
    [studentId]
  )

  // 10-second Phone Reveal Timer
  useEffect(() => {
    let timer = null
    if (phoneRevealed && revealCountdown > 0) {
      timer = setTimeout(() => {
        setRevealCountdown((c) => c - 1)
      }, 1000)
    } else if (phoneRevealed && revealCountdown === 0) {
      setPhoneRevealed(false)
    }
    return () => clearTimeout(timer)
  }, [phoneRevealed, revealCountdown])

  const handleRevealPhone = () => {
    if (phoneRevealed) {
      setPhoneRevealed(false)
      setRevealCountdown(0)
    } else {
      setPhoneRevealed(true)
      setRevealCountdown(10)
    }
  }

  // Open Payment Modal
  const openPaymentModal = (inst) => {
    const balancePaise = inst
      ? Math.max(0, inst.amountPaise - (inst.paidPaise || 0))
      : student?.plan?.balancePaise || 0
    const balanceRupees = Math.floor(balancePaise / 100)

    setPayingInstalment(inst || student?.instalments?.find((i) => i.balancePaise > 0) || null)
    setPayAmountRupees(String(balanceRupees))
    setPayMethod('cash')
    setPayReference('')
    setPayDate(new Date().toISOString().slice(0, 10))
    setIdempotencyKey(`pay_${studentId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
    setPaymentError(null)
    setPaymentSuccess(null)
  }

  // Handle Payment Submit
  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    if (!payingInstalment) return

    const balancePaise = Math.max(0, payingInstalment.amountPaise - (payingInstalment.paidPaise || 0))
    const amountNum = parseFloat(payAmountRupees)

    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError(isHindi ? 'कृपया मान्य राशि दर्ज करें।' : 'Enter a valid amount (minimum ₹1).')
      return
    }

    const inputPaise = Math.round(amountNum * 100)
    if (inputPaise > balancePaise) {
      setPaymentError(
        isHindi
          ? `राशि किस्त के शेष बकाया ${formatPaise(balancePaise)} से अधिक नहीं हो सकती।`
          : `Amount cannot exceed remaining balance of ${formatPaise(balancePaise)}.`
      )
      return
    }

    if (payMethod !== 'cash' && !payReference.trim()) {
      setPaymentError(
        isHindi
          ? 'गैर-नकद भुगतान के लिए संदर्भ संख्या (UTR / चेक संख्या) आवश्यक है।'
          : 'Payment reference / transaction ID is required for non-cash methods.'
      )
      return
    }

    setIsSubmittingPayment(true)
    setPaymentError(null)

    try {
      const res = await staffApi.recordStudentPayment(studentId, {
        instalmentId: payingInstalment._id,
        amountPaise: inputPaise,
        method: payMethod,
        gatewayRef: payReference.trim() || undefined,
        paidAt: payDate,
        idempotencyKey,
      })

      setPaymentSuccess(res.receipt || { receiptNo: `RCP-${Date.now().toString().slice(-6)}` })
      showToast(isHindi ? 'भुगतान सफलतापूर्वक दर्ज किया गया!' : 'Payment recorded successfully!', 'success')
      refetch()
    } catch (err) {
      setPaymentError(
        err.message || (isHindi ? 'भुगतान दर्ज करने में त्रुटि हुई।' : 'Failed to record payment.')
      )
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  // Copy Payment Link
  const handleCopyLink = (instId) => {
    const url = `${window.location.origin}/portal?student=${studentId}`
    navigator.clipboard.writeText(url)
    setCopiedInstalmentId(instId)
    showToast(isHindi ? 'पेमेंट लिंक कॉपी हुआ!' : 'Payment portal link copied to clipboard!', 'success')
    setTimeout(() => setCopiedInstalmentId(null), 2500)
  }

  // Next Due Date Calculation
  const nextUnpaidInstalment = student?.instalments?.find((i) => i.balancePaise > 0)
  const isAllPaid = student?.plan?.balancePaise === 0

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="animate-spin text-[#0E4D44]" size={28} />
        <div className="text-sm font-medium text-[#7A8582]">Loading student ledger...</div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-8 text-center max-w-lg mx-auto space-y-4 my-12">
        <div className="w-12 h-12 rounded-full bg-[#FDECEA] text-[#B3261E] flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="font-serif font-bold text-2xl text-[#14211F]">
          {isHindi ? 'विद्यार्थी नहीं मिला' : 'Student Not Found'}
        </h2>
        <p className="text-xs text-[#7A8582]">
          {isHindi
            ? `विद्यार्थी आईडी "${studentId}" का कोई रिकॉर्ड संस्थान में नहीं मिला।`
            : `No student records matching ID "${studentId}" were found in the database.`}
        </p>
        <Link
          to="/accounts/students"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E4D44] text-white text-xs font-semibold hover:bg-[#0A3B34] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{isHindi ? 'विद्यार्थी सूची पर वापस जाएं' : 'Back to Students Directory'}</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          TOP BAR & NAVIGATION BREADCRUMB
         ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-[#7A8582]">
        <Link to="/accounts/students" className="hover:text-[#14211F] transition-colors flex items-center gap-1">
          <ArrowLeft size={12} />
          <span>{isHindi ? 'विद्यार्थी निर्देशिका' : 'Students'}</span>
        </Link>
        <span>/</span>
        <span className="font-mono text-[#0E4D44] font-semibold">{student.studentId}</span>
      </div>

      {/* ──────────────────────────────────────────────────────────
          STUDENT HEADER CARD
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
              {student.name}
            </h1>
            <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-[#FAF8F4] border border-[#E7E3DA] text-[#0E4D44]">
              {student.studentId}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                student.status === 'left'
                  ? 'bg-[#FDECEA] text-[#B3261E]'
                  : 'bg-[#E8F4EC] text-[#1F7A4D]'
              }`}
            >
              {student.status === 'left' ? (isHindi ? 'छोड़ चुके' : 'Left') : isHindi ? 'सक्रिय' : 'Active'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#4A5654]">
            <span className="font-medium">{student.batch}</span>
            <span>•</span>
            <span>{student.centre}</span>
            <span>•</span>
            <span>{student.course}</span>
          </div>

          {/* Masked Phone with 10s Reveal Button */}
          <div className="flex items-center gap-2 pt-1">
            <Phone size={13} className="text-[#7A8582]" />
            <span className="text-xs font-mono font-medium text-[#14211F]">
              {phoneRevealed ? student.guardianPhone : maskPhone(student.guardianPhone)}
            </span>
            <button
              type="button"
              onClick={handleRevealPhone}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors ${
                phoneRevealed
                  ? 'border-[#B3261E] bg-[#FDECEA] text-[#B3261E]'
                  : 'border-[#E7E3DA] bg-white text-[#4A5654] hover:border-[#0E4D44] hover:text-[#0E4D44]'
              }`}
              title="Reveal phone number for 10 seconds"
            >
              {phoneRevealed ? (
                <>
                  <EyeOff size={11} />
                  <span>{revealCountdown}s</span>
                </>
              ) : (
                <>
                  <Eye size={11} />
                  <span>{isHindi ? 'दिखाएं' : 'Reveal'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Header Actions: Record Payment & Calculate Refund */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => openPaymentModal(null)}
            disabled={isAllPaid}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            <CreditCard size={14} />
            <span>{isHindi ? 'भुगतान दर्ज करें' : 'Record payment'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/accounts/refunds/new?studentId=${encodeURIComponent(student.studentId)}`)}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-semibold text-[#4A5654] transition-colors shadow-xs"
          >
            <RotateCcw size={14} />
            <span>{isHindi ? 'रिफंड गणना' : 'Calculate refund'}</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          FEE SUMMARY METRICS
         ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#7A8582] uppercase tracking-wider">
            {isHindi ? 'कुल योजना शुल्क' : 'Total Course Fee'}
          </div>
          <div className="font-serif font-bold text-xl text-[#14211F] mt-1 tabular-nums">
            {formatPaise(student.plan?.totalPaise)}
          </div>
          <div className="text-[10px] text-[#7A8582] mt-1">
            {student.instalments?.length || 0} {isHindi ? 'किस्तें' : 'instalments'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#7A8582] uppercase tracking-wider">
            {isHindi ? 'छात्रवृत्ति छूट' : 'Discount'}
          </div>
          <div className="font-serif font-bold text-xl text-[#14211F] mt-1 tabular-nums">
            {formatPaise(student.plan?.discountPaise)}
          </div>
          <div className="text-[10px] text-[#7A8582] mt-1">
            {isHindi ? 'प्रवेश पर स्वीकृत' : 'Approved scholarship'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#1F7A4D] uppercase tracking-wider">
            {isHindi ? 'कुल जमा (Paid)' : 'Total Paid'}
          </div>
          <div className="font-serif font-bold text-xl text-[#1F7A4D] mt-1 tabular-nums">
            {formatPaise(student.plan?.paidPaise)}
          </div>
          <div className="text-[10px] text-[#7A8582] mt-1">
            {student.receipts?.length || 0} {isHindi ? 'रसीदें निर्गत' : 'receipts generated'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-[#B3261E] uppercase tracking-wider">
            {isHindi ? 'शेष देय (Balance)' : 'Net Balance'}
          </div>
          <div className="font-serif font-bold text-xl text-[#B3261E] mt-1 tabular-nums">
            {formatPaise(student.plan?.balancePaise)}
          </div>
          <div className="text-[10px] text-[#7A8582] mt-1">
            {isAllPaid ? (isHindi ? 'पूर्ण चुकता' : 'Fully settled') : isHindi ? 'बकाया देय' : 'Pending dues'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-[#7A8582] uppercase tracking-wider">
            {isHindi ? 'अगली देय तिथि' : 'Next Due Date'}
          </div>
          <div className="font-serif font-bold text-lg text-[#14211F] mt-1 tabular-nums truncate">
            {nextUnpaidInstalment ? formatDate(nextUnpaidInstalment.dueDate, lang) : isHindi ? 'कोई नहीं' : 'None'}
          </div>
          <div className="text-[10px] text-[#7A8582] mt-1">
            {nextUnpaidInstalment ? formatPaise(nextUnpaidInstalment.balancePaise) : 'All paid'}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          TAB CONTROLS
         ────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#E7E3DA] flex items-center gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('instalments')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'instalments'
              ? 'border-[#0E4D44] text-[#0E4D44]'
              : 'border-transparent text-[#7A8582] hover:text-[#14211F]'
          }`}
        >
          <Calendar size={14} />
          <span>{isHindi ? 'किस्त अनुसूची' : 'Fee Schedule'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#FAF8F4] text-[#4A5654] text-[10px]">
            {student.instalments?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'border-[#0E4D44] text-[#0E4D44]'
              : 'border-transparent text-[#7A8582] hover:text-[#14211F]'
          }`}
        >
          <CreditCard size={14} />
          <span>{isHindi ? 'भुगतान व जीएसटी रसीदें' : 'Payments & Receipts'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#FAF8F4] text-[#4A5654] text-[10px]">
            {student.payments?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reminders')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'reminders'
              ? 'border-[#0E4D44] text-[#0E4D44]'
              : 'border-transparent text-[#7A8582] hover:text-[#14211F]'
          }`}
        >
          <Bell size={14} />
          <span>{isHindi ? 'रिमाइंडर इतिहास' : 'Reminders'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#FAF8F4] text-[#4A5654] text-[10px]">
            {student.reminders?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('risk')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'risk'
              ? 'border-[#0E4D44] text-[#0E4D44]'
              : 'border-transparent text-[#7A8582] hover:text-[#14211F]'
          }`}
        >
          <ShieldAlert size={14} />
          <span>{isHindi ? 'ड्रॉपआउट जोखिम' : 'Risk Assessment'}</span>
          {student.riskFlag && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-white text-[10px] font-bold ${
                student.riskFlag.level === 'high'
                  ? 'bg-[#B3261E]'
                  : student.riskFlag.level === 'medium'
                  ? 'bg-[#D98A1E]'
                  : 'bg-[#1F7A4D]'
              }`}
            >
              {student.riskFlag.score}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('refund')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'refund'
              ? 'border-[#0E4D44] text-[#0E4D44]'
              : 'border-transparent text-[#7A8582] hover:text-[#14211F]'
          }`}
        >
          <RotateCcw size={14} />
          <span>{isHindi ? 'रिफंड' : 'Refund'}</span>
          {student.refundRequest && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#D98A1E] text-white text-[10px]">
              1
            </span>
          )}
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
          TAB 1: INSTALMENT SCHEDULE TABLE
         ────────────────────────────────────────────────────────── */}
      {activeTab === 'instalments' && (
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base text-[#14211F]">
                {isHindi ? 'किस्त अनुसूची (Fee Schedule)' : 'Fee Instalment Schedule'}
              </h2>
              <p className="text-xs text-[#7A8582] mt-0.5">
                {isHindi
                  ? 'प्रत्येक किस्त की देय तिथि, राशि, भुगतान स्थिति एवं लिंक'
                  : 'Scheduled amounts, payment records, and payment link actions per instalment'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Fee Instalments">
              <thead className="border-b border-[#E7E3DA] text-[#7A8582] font-semibold">
                <tr>
                  <th scope="col" className="pb-3">
                    #
                  </th>
                  <th scope="col" className="pb-3">
                    {isHindi ? 'देय तिथि' : 'Due Date'}
                  </th>
                  <th scope="col" className="pb-3 text-right">
                    {isHindi ? 'किस्त राशि' : 'Amount'}
                  </th>
                  <th scope="col" className="pb-3 text-right">
                    {isHindi ? 'जमा राशि' : 'Paid'}
                  </th>
                  <th scope="col" className="pb-3 text-right">
                    {isHindi ? 'शेष बकाया' : 'Balance'}
                  </th>
                  <th scope="col" className="pb-3 text-center">
                    {isHindi ? 'स्थिति' : 'Status'}
                  </th>
                  <th scope="col" className="pb-3 text-right">
                    {isHindi ? 'कार्रवाई' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]/60">
                {student.instalments?.map((inst) => {
                  const isPaid = inst.balancePaise === 0
                  const isOverdue = inst.daysOverdue > 0

                  return (
                    <tr key={inst._id} className="hover:bg-[#FAF8F4] transition-colors">
                      <td className="py-3.5 pr-2 font-mono font-bold text-xs text-[#0E4D44]">
                        Inst. {inst.sequence}
                      </td>
                      <td className="py-3.5 pr-2 text-[#14211F] font-medium">
                        {formatDate(inst.dueDate, lang)}
                      </td>
                      <td className="py-3.5 pr-2 text-right font-serif font-bold tabular-nums text-[#14211F]">
                        {formatPaise(inst.amountPaise)}
                      </td>
                      <td className="py-3.5 pr-2 text-right font-serif font-bold tabular-nums text-[#1F7A4D]">
                        {formatPaise(inst.paidPaise)}
                      </td>
                      <td className="py-3.5 pr-2 text-right font-serif font-bold tabular-nums text-[#B3261E]">
                        {formatPaise(inst.balancePaise)}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F4EC] text-[#1F7A4D]">
                            <CheckCircle2 size={11} />
                            <span>{isHindi ? 'चुकता' : 'Paid'}</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEA] text-[#B3261E]">
                            <AlertCircle size={11} />
                            <span>{inst.daysOverdue} d late</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF4E0] text-[#9A5B0B]">
                            <Clock size={11} />
                            <span>{isHindi ? 'आगामी' : 'Upcoming'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPaid && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCopyLink(inst._id)}
                                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-[11px] font-semibold text-[#4A5654] transition-colors"
                                title="Copy direct payment link"
                              >
                                {copiedInstalmentId === inst._id ? (
                                  <>
                                    <Check size={11} className="text-[#1F7A4D]" />
                                    <span className="text-[#1F7A4D]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={11} />
                                    <span>Link</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => openPaymentModal(inst)}
                                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-[11px] font-semibold transition-colors"
                              >
                                <span>Record</span>
                              </button>
                            </>
                          )}
                          {isPaid && (
                            <span className="text-[11px] text-[#7A8582] italic">
                              {inst.paidAt ? formatDate(inst.paidAt, lang) : 'Settled'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 2: PAYMENTS AND GST RECEIPTS
         ────────────────────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base text-[#14211F]">
                {isHindi ? 'भुगतान व जीएसटी चालान' : 'Payment Transactions & Tax Invoices'}
              </h2>
              <p className="text-xs text-[#7A8582] mt-0.5">
                {isHindi
                  ? 'आधिकारिक 18% जीएसटी युक्त रसीदें देखने के लिए रसीद संख्या पर क्लिक करें'
                  : 'Click any receipt number to view and print the official GST tax invoice'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Receipts">
              <thead className="border-b border-[#E7E3DA] text-[#7A8582] font-semibold">
                <tr>
                  <th scope="col" className="pb-3">
                    {isHindi ? 'दिनांक' : 'Date'}
                  </th>
                  <th scope="col" className="pb-3 text-right">
                    {isHindi ? 'जमा राशि' : 'Amount'}
                  </th>
                  <th scope="col" className="pb-3">
                    {isHindi ? 'माध्यम' : 'Method'}
                  </th>
                  <th scope="col" className="pb-3">
                    {isHindi ? 'संदर्भ (Ref)' : 'Reference'}
                  </th>
                  <th scope="col" className="pb-3 text-right">
                    {isHindi ? 'जीएसटी रसीद संख्या' : 'Receipt No.'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]/60">
                {!student.receipts || student.receipts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#7A8582]">
                      No payments or receipts recorded yet.
                    </td>
                  </tr>
                ) : (
                  student.receipts.map((rcp) => {
                    const payment = student.payments?.find((p) => p._id === rcp.paymentId)
                    return (
                      <tr key={rcp._id} className="hover:bg-[#FAF8F4] transition-colors">
                        <td className="py-3.5 pr-2 font-medium text-[#14211F]">
                          {formatDate(rcp.issuedAt, lang)}
                        </td>
                        <td className="py-3.5 pr-2 text-right font-serif font-bold tabular-nums text-[#1F7A4D]">
                          {formatPaise(rcp.amountPaise)}
                        </td>
                        <td className="py-3.5 pr-2 uppercase font-mono font-medium text-[#4A5654]">
                          {payment?.method || 'CASH'}
                        </td>
                        <td className="py-3.5 pr-2 font-mono text-[11px] text-[#7A8582]">
                          {payment?.gatewayRef || '—'}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(rcp)}
                            className="inline-flex items-center gap-1 font-mono font-bold text-xs text-[#0E4D44] hover:underline"
                          >
                            <FileText size={12} />
                            <span>{rcp.receiptNo}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 3: REMINDER LOGS
         ────────────────────────────────────────────────────────── */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base text-[#14211F]">
                {isHindi ? 'रिमाइंडर इतिहास' : 'Automated Reminder Logs'}
              </h2>
              <p className="text-xs text-[#7A8582] mt-0.5">
                {isHindi
                  ? 'शुल्क जमा होने पर आगामी रिमाइंडर स्वतः "Stopped: paid" हो जाते हैं'
                  : 'Automated SMS reminders stop immediately when instalment payment is confirmed'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Reminders">
              <thead className="border-b border-[#E7E3DA] text-[#7A8582] font-semibold">
                <tr>
                  <th scope="col" className="pb-3">
                    {isHindi ? 'समय (Offset)' : 'Schedule Offset'}
                  </th>
                  <th scope="col" className="pb-3">
                    {isHindi ? 'चैनल' : 'Channel'}
                  </th>
                  <th scope="col" className="pb-3">
                    {isHindi ? 'भाषा' : 'Language'}
                  </th>
                  <th scope="col" className="pb-3 text-right">
                    {isHindi ? 'स्थिति' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E3DA]/60">
                {!student.reminders || student.reminders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#7A8582]">
                      No reminder schedules found for this student.
                    </td>
                  </tr>
                ) : (
                  student.reminders.map((rem) => {
                    const isStoppedPaid = rem.status === 'skipped_paid'
                    return (
                      <tr key={rem._id} className="hover:bg-[#FAF8F4] transition-colors">
                        <td className="py-3.5 pr-2 font-medium text-[#14211F]">
                          {formatReminderOffset(rem, lang)}
                        </td>
                        <td className="py-3.5 pr-2 uppercase font-mono text-[11px] text-[#4A5654]">
                          {rem.channel || 'SMS'}
                        </td>
                        <td className="py-3.5 pr-2 text-[#4A5654]">
                          {rem.language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}
                        </td>
                        <td className="py-3.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isStoppedPaid
                                ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                                : rem.status === 'sent'
                                ? 'bg-[#E6F0EE] text-[#0E4D44]'
                                : 'bg-[#FAF8F4] border border-[#E7E3DA] text-[#7A8582]'
                            }`}
                          >
                            {isStoppedPaid && <CheckCircle2 size={11} />}
                            <span>
                              {isStoppedPaid
                                ? isHindi
                                  ? 'भुगतान उपरांत रोका गया (Stopped: paid)'
                                  : 'Stopped: paid'
                                : rem.status}
                            </span>
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 4: RISK ASSESSMENT
         ────────────────────────────────────────────────────────── */}
      {activeTab === 'risk' && (
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base text-[#14211F]">
                {isHindi ? 'ड्रॉपआउट जोखिम मूल्यांकन' : 'Dropout Risk Analysis'}
              </h2>
              <p className="text-xs text-[#7A8582] mt-0.5">
                {isHindi
                  ? 'उपस्थिति, परीक्षा अंक और शुल्क देरी के आधार पर स्वचालित जोखिम स्कोर'
                  : 'Automated, explainable scoring based on attendance, test scores, and fee delays'}
              </p>
            </div>

            {student.riskFlag && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  student.riskFlag.level === 'high'
                    ? 'bg-[#FDECEA] text-[#B3261E]'
                    : student.riskFlag.level === 'medium'
                    ? 'bg-[#FFF4E0] text-[#9A5B0B]'
                    : 'bg-[#E8F4EC] text-[#1F7A4D]'
                }`}
              >
                <ShieldAlert size={13} />
                <span>Score: {student.riskFlag.score}/100 • {student.riskFlag.level}</span>
              </span>
            )}
          </div>

          {!student.riskFlag ? (
            <div className="p-8 text-center text-[#7A8582]">
              No elevated risk flags recorded. Academic and fee records are within normal bounds.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-[#14211F]">
                {isHindi ? 'जोखिम कारक (Risk Contributing Factors):' : 'Scoring Factors Breakdown:'}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {student.riskFlag.reasons?.map((r, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-[#14211F]">{r.label}</span>
                    <span className="text-xs font-bold text-[#B3261E] bg-[#FDECEA] px-2 py-0.5 rounded-md">
                      +{r.points} pts
                    </span>
                  </div>
                ))}
              </div>

              {/* Status Note */}
              <div className="p-4 rounded-xl border border-[#E7E3DA] bg-white flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#7A8582]">Current flag status: </span>
                  <span className="font-semibold text-[#14211F] uppercase">{student.riskFlag.status}</span>
                </div>
                <Link
                  to="/accounts/risk"
                  className="font-semibold text-[#0E4D44] hover:underline flex items-center gap-1"
                >
                  <span>Go to Call Tasks</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          TAB 5: REFUND
         ────────────────────────────────────────────────────────── */}
      {activeTab === 'refund' && (
        <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-base text-[#14211F]">
                {isHindi ? 'रिफंड स्थिति' : 'Fee Refund Record'}
              </h2>
              <p className="text-xs text-[#7A8582] mt-0.5">
                {isHindi
                  ? 'विद्यार्थी द्वारा संस्थान छोड़ने पर आधिकारिक 3-स्तरीय रिफंड नियम'
                  : 'Statutory withdrawal calculations in compliance with institute refund rules'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/accounts/refunds/new?studentId=${encodeURIComponent(student.studentId)}`)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#0E4D44] text-white text-xs font-semibold hover:bg-[#0A3B34] transition-colors"
            >
              <RotateCcw size={13} />
              <span>{isHindi ? 'नई रिफंड गणना' : 'Calculate Refund'}</span>
            </button>
          </div>

          {!student.refundRequest ? (
            <div className="p-8 text-center text-[#7A8582]">
              No refund claims recorded for this student.
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#14211F]">Refund Request Status:</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[#FFF4E0] text-[#9A5B0B]">
                  {student.refundRequest.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E7E3DA]">
                <div>
                  <span className="text-[#7A8582]">Leave Date: </span>
                  <span className="font-medium text-[#14211F]">{formatDate(student.refundRequest.leaveDate, lang)}</span>
                </div>
                <div>
                  <span className="text-[#7A8582]">Refund Amount: </span>
                  <span className="font-serif font-bold text-[#14211F] text-sm tabular-nums">
                    {formatPaise(student.refundRequest.refundAmountPaise)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          RECORD PAYMENT MODAL (FOCUS TRAP, ESC CLOSE, IDEMPOTENT)
         ────────────────────────────────────────────────────────── */}
      {payingInstalment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#14211F]/40 backdrop-blur-xs"
            onClick={() => !isSubmittingPayment && setPayingInstalment(null)}
            aria-hidden="true"
          />

          <div
            className="relative bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-xl space-y-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pay-dialog-title"
          >
            {paymentSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h3 className="font-serif font-bold text-xl text-[#14211F]">
                  {isHindi ? 'भुगतान सफल!' : 'Payment Recorded Successfully'}
                </h3>
                <p className="text-xs text-[#7A8582]">
                  {isHindi ? 'जीएसटी रसीद संख्या: ' : 'GST Tax Invoice: '}
                  <span className="font-mono font-bold text-[#0E4D44]">{paymentSuccess.receiptNo}</span>
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingReceipt(paymentSuccess)
                      setPayingInstalment(null)
                    }}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] hover:border-[#0E4D44] hover:text-[#0E4D44]"
                  >
                    <Printer size={13} />
                    <span>View Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayingInstalment(null)}
                    className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-[#0E4D44] text-white text-xs font-semibold hover:bg-[#0A3B34]"
                  >
                    <span>Done</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} className="text-[#0E4D44]" />
                    <h3 id="pay-dialog-title" className="font-serif font-bold text-lg text-[#14211F]">
                      {isHindi ? 'ऑफलाइन भुगतान दर्ज करें' : 'Record Student Payment'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmittingPayment}
                    onClick={() => setPayingInstalment(null)}
                    className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
                  >
                    <X size={18} />
                  </button>
                </div>

                {paymentError && (
                  <div className="p-3 rounded-xl bg-[#FDECEA] border border-[#B3261E]/30 text-xs text-[#B3261E] flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label htmlFor="pay-amt" className="block text-xs font-semibold text-[#4A5654] mb-1">
                    {isHindi ? 'भुगतान राशि (₹)' : 'Payment Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    id="pay-amt"
                    min="1"
                    step="1"
                    value={payAmountRupees}
                    onChange={(e) => setPayAmountRupees(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-sm font-semibold text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                  />
                  <div className="text-[11px] text-[#7A8582] mt-1">
                    Maximum remaining balance: {formatPaise(payingInstalment.balancePaise)}
                  </div>
                </div>

                {/* Method */}
                <div>
                  <label htmlFor="pay-method" className="block text-xs font-semibold text-[#4A5654] mb-1">
                    {isHindi ? 'भुगतान माध्यम' : 'Payment Method'}
                  </label>
                  <select
                    id="pay-method"
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                  >
                    <option value="cash">{isHindi ? 'नकद (Cash)' : 'Cash'}</option>
                    <option value="upi">{isHindi ? 'यूपीआई (UPI)' : 'UPI'}</option>
                    <option value="card">{isHindi ? 'कार्ड (Card / POS)' : 'Card'}</option>
                    <option value="cheque">{isHindi ? 'चेक (Cheque)' : 'Cheque'}</option>
                  </select>
                </div>

                {/* Reference */}
                {payMethod !== 'cash' && (
                  <div>
                    <label htmlFor="pay-ref" className="block text-xs font-semibold text-[#4A5654] mb-1">
                      {isHindi ? 'संदर्भ संख्या (UTR / चेक संख्या)' : 'Transaction Reference / UTR'}
                    </label>
                    <input
                      type="text"
                      id="pay-ref"
                      placeholder="e.g. UTR-98290123"
                      value={payReference}
                      onChange={(e) => setPayReference(e.target.value)}
                      required
                      className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                    />
                  </div>
                )}

                {/* Date */}
                <div>
                  <label htmlFor="pay-date" className="block text-xs font-semibold text-[#4A5654] mb-1">
                    {isHindi ? 'भुगतान तिथि' : 'Payment Date'}
                  </label>
                  <input
                    type="date"
                    id="pay-date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7E3DA]">
                  <button
                    type="button"
                    disabled={isSubmittingPayment}
                    onClick={() => setPayingInstalment(null)}
                    className="h-10 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] hover:bg-[#FAF8F4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="h-10 px-5 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Confirm & Issue Receipt</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          PRINTABLE GST TAX INVOICE MODAL
         ────────────────────────────────────────────────────────── */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#14211F]/50 backdrop-blur-xs"
            onClick={() => setViewingReceipt(null)}
            aria-hidden="true"
          />

          <div className="relative bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
              <span className="font-mono font-bold text-xs text-[#0E4D44]">
                {viewingReceipt.receiptNo}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E7E3DA] bg-white hover:bg-[#FAF8F4] text-xs font-semibold text-[#4A5654]"
                >
                  <Printer size={12} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Content */}
            <div className="space-y-4 text-xs font-sans">
              <div className="text-center space-y-1 pb-3 border-b border-[#E7E3DA]">
                <div className="font-serif font-bold text-base text-[#14211F]">
                  FeeDesk Coaching Institute
                </div>
                <div className="text-[11px] text-[#7A8582]">
                  Plot 14, Gopalpura Bypass, Tonk Road, Jaipur 302015
                </div>
                <div className="font-mono text-[10px] text-[#7A8582]">
                  GSTIN: 08AAAAA0000A1Z5 • SAC: 999293 (Tuition & Coaching)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#7A8582]">Student: </span>
                  <span className="font-semibold text-[#14211F]">{student.name}</span>
                </div>
                <div>
                  <span className="text-[#7A8582]">Student ID: </span>
                  <span className="font-mono font-semibold text-[#14211F]">{student.studentId}</span>
                </div>
                <div>
                  <span className="text-[#7A8582]">Batch: </span>
                  <span className="text-[#14211F]">{student.batch}</span>
                </div>
                <div>
                  <span className="text-[#7A8582]">Date: </span>
                  <span className="text-[#14211F]">{formatDate(viewingReceipt.issuedAt, lang)}</span>
                </div>
              </div>

              {/* Tax Breakup Table */}
              <div className="border border-[#E7E3DA] rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#FAF8F4] border-b border-[#E7E3DA] font-semibold text-[#7A8582]">
                    <tr>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Taxable</th>
                      <th className="p-2 text-right">CGST (9%)</th>
                      <th className="p-2 text-right">SGST (9%)</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E3DA]">
                    <tr>
                      <td className="p-2 font-medium">Classroom Tuition Fee</td>
                      <td className="p-2 text-right tabular-nums">
                        {formatPaise(viewingReceipt.taxableValuePaise)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatPaise(Math.round((viewingReceipt.gstPaise || 0) / 2))}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatPaise(Math.round((viewingReceipt.gstPaise || 0) / 2))}
                      </td>
                      <td className="p-2 text-right font-serif font-bold tabular-nums text-[#1F7A4D]">
                        {formatPaise(viewingReceipt.amountPaise)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-[#7A8582] text-center italic pt-2">
                This is an official computer-generated GST tax invoice under Rule 46 of CGST Rules, 2017.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
