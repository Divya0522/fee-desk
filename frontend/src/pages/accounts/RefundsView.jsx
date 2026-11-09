import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
  Clock,
  ShieldCheck,
  Check,
  X,
  FileText,
  User,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/useAuth'
import * as staffApi from '../../services/staffApi'
import { getRefundPolicy } from '../../services/policyApi'
import { formatPaise, formatDate } from '../../utils/format'
import StatusChip from '../../components/common/StatusChip'
import { useLang } from '../../i18n/useLang'

const CENTRES = ['ALL', 'Jaipur Main', 'Jaipur South', 'Kota', 'Sikar']

export default function RefundsView() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useAuth()
  const [searchParams] = useSearchParams()

  const isNewView = location.pathname.includes('/new') || searchParams.has('studentId')
  const [activeTab, setActiveTab] = useState(isNewView ? 'calculator' : 'queue')

  // Calculator State
  const initialStudentId = searchParams.get('studentId') || ''
  const [studentIdInput, setStudentIdInput] = useState(initialStudentId)
  const [leaveDateInput, setLeaveDateInput] = useState(new Date().toISOString().slice(0, 10))
  const [isCalculating, setIsCalculating] = useState(false)
  const [calcPreview, setCalcPreview] = useState(null)
  const [calcError, setCalcError] = useState(null)
  const [policyExpanded, setPolicyExpanded] = useState(false)
  const [isSavingRefund, setIsSavingRefund] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Refunds Queue State
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [centreFilter, setCentreFilter] = useState('ALL')
  const [activeActionModal, setActiveActionModal] = useState(null) // { type: 'approve'|'reject'|'paid', refund }
  const [actionNote, setActionNote] = useState('')
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)

  // Fetch Refunds List
  const {
    data: refundsData,
    isLoading: refundsLoading,
    refetch: refetchRefunds,
  } = useApi(
    () => staffApi.getRefundsList({ status: statusFilter, centre: centreFilter }),
    [statusFilter, centreFilter]
  )

  // Single Source of Truth Policy
  const { data: policyData } = useApi(getRefundPolicy, [])

  // Calculate Refund Preview
  const handleCalculate = async (e) => {
    e.preventDefault()
    if (!studentIdInput || !leaveDateInput) return

    setIsCalculating(true)
    setCalcError(null)
    setCalcPreview(null)

    try {
      const res = await staffApi.calculateRefundPreview({
        studentId: studentIdInput.trim().toUpperCase(),
        leaveDate: leaveDateInput,
      })
      setCalcPreview(res)
    } catch (err) {
      setCalcError(err.message || (isHindi ? 'गणना करने में त्रुटि हुई' : 'Calculation error'))
    } finally {
      setIsCalculating(false)
    }
  }

  // Save Confirmed Refund
  const handleConfirmSave = async () => {
    if (!studentIdInput || !leaveDateInput) return
    setIsSavingRefund(true)
    try {
      await staffApi.createRefundRequest({
        studentId: studentIdInput.trim().toUpperCase(),
        leaveDate: leaveDateInput,
      })
      showToast(
        isHindi
          ? 'रिफंड अनुरोध सफलतापूर्वक दर्ज हुआ! विद्यार्थी की स्थिति "छोड़ चुके" चिन्हित की गई।'
          : 'Refund request created and student status marked as left.',
        'success'
      )
      setShowConfirmModal(false)
      setCalcPreview(null)
      setStudentIdInput('')
      refetchRefunds()
      setActiveTab('queue')
      navigate('/accounts/refunds', { replace: true })
    } catch (err) {
      showToast(err.message || (isHindi ? 'रिफंड सहेजने में विफल' : 'Failed to save refund request'), 'error')
    } finally {
      setIsSavingRefund(false)
    }
  }

  // Handle Workflow Action (Approve / Reject / Mark Paid)
  const handleWorkflowAction = async () => {
    if (!activeActionModal) return
    const { type, refund } = activeActionModal

    if (type === 'reject' && !actionNote.trim()) {
      showToast(isHindi ? 'अस्वीकृति के लिए कारण आवश्यक है।' : 'Reason is required for rejection.', 'error')
      return
    }

    setIsSubmittingAction(true)
    try {
      if (type === 'approve') {
        await staffApi.approveRefund(refund._id)
        showToast(isHindi ? 'रिफंड स्वीकृत किया गया।' : 'Refund approved successfully.', 'success')
      } else if (type === 'reject') {
        await staffApi.rejectRefund(refund._id, { note: actionNote.trim() })
        showToast(isHindi ? 'रिफंड अस्वीकृत किया गया।' : 'Refund marked as rejected.', 'info')
      } else if (type === 'paid') {
        await staffApi.markRefundPaid(refund._id)
        showToast(isHindi ? 'रिफंड भुगतान पूर्ण चिन्हित हुआ!' : 'Refund payout confirmed!', 'success')
      }
      setActiveActionModal(null)
      setActionNote('')
      refetchRefunds()
    } catch (err) {
      showToast(err.message || (isHindi ? 'कार्रवाई विफल' : 'Action failed'), 'error')
    } finally {
      setIsSubmittingAction(false)
    }
  }

  const nowMs = Date.now()

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          HEADER
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
              {isHindi ? 'शुल्क रिफंड प्रबंधन' : 'Refunds Management'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E8F4EC] text-[#1F7A4D]">
              <ShieldCheck size={13} />
              <span>{isHindi ? 'नियमबद्ध नीति' : 'Policy v1.0'}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1">
            {isHindi
              ? 'लिखित रिफंड नियमों के अनुसार निष्पक्ष गणना, अनुमोदन और बैंक भुगतान ट्रैकिंग'
              : 'Calculate statutory withdrawals, approve payouts, and enforce the 10-day settlement SLA'}
          </p>
        </div>

        {/* View Toggle Buttons */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA]">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'queue'
                ? 'bg-white text-[#0E4D44] shadow-xs'
                : 'text-[#4A5654] hover:text-[#14211F]'
            }`}
          >
            {isHindi ? 'रिफंड कतार' : 'Refunds Queue'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'calculator'
                ? 'bg-white text-[#0E4D44] shadow-xs'
                : 'text-[#4A5654] hover:text-[#14211F]'
            }`}
          >
            {isHindi ? 'कैलकुलेटर' : 'New Calculation'}
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────
          VIEW 1: REFUNDS QUEUE & WORKFLOW
         ────────────────────────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="ref-status" className="text-xs font-semibold text-[#7A8582]">
                  {isHindi ? 'स्थिति:' : 'Status:'}
                </label>
                <select
                  id="ref-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                >
                  <option value="ALL">{isHindi ? 'सभी स्थितियाँ' : 'All status'}</option>
                  <option value="calculated">{isHindi ? 'गणना संपन्न (Calculated)' : 'Calculated'}</option>
                  <option value="approved">{isHindi ? 'स्वीकृत (Approved)' : 'Approved'}</option>
                  <option value="paid">{isHindi ? 'भुगतान संपन्न (Paid)' : 'Paid'}</option>
                  <option value="rejected">{isHindi ? 'अस्वीकृत (Rejected)' : 'Rejected'}</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="ref-centre" className="text-xs font-semibold text-[#7A8582]">
                  {isHindi ? 'केंद्र:' : 'Centre:'}
                </label>
                <select
                  id="ref-centre"
                  value={centreFilter}
                  onChange={(e) => setCentreFilter(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                >
                  {CENTRES.map((c) => (
                    <option key={c} value={c}>
                      {c === 'ALL' ? (isHindi ? 'सभी केंद्र' : 'All centres') : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refetchRefunds()}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-semibold text-[#4A5654] transition-colors"
            >
              <RefreshCw size={13} className={refundsLoading ? 'animate-spin text-[#0E4D44]' : ''} />
              <span>{isHindi ? 'ताज़ा करें' : 'Refresh'}</span>
            </button>
          </div>

          {/* Refunds Table */}
          <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs" aria-label="Refunds Queue">
                <thead className="border-b border-[#E7E3DA] text-[#7A8582] font-semibold">
                  <tr>
                    <th scope="col" className="pb-3">
                      {isHindi ? 'विद्यार्थी' : 'Student'}
                    </th>
                    <th scope="col" className="pb-3">
                      {isHindi ? 'छोड़ने की तिथि' : 'Leave Date'}
                    </th>
                    <th scope="col" className="pb-3 text-right">
                      {isHindi ? 'रिफंड राशि' : 'Refund Amount'}
                    </th>
                    <th scope="col" className="pb-3 text-center">
                      {isHindi ? 'स्थिति' : 'Status'}
                    </th>
                    <th scope="col" className="pb-3">
                      {isHindi ? 'भुगतान समय सीमा' : 'Payout SLA'}
                    </th>
                    <th scope="col" className="pb-3 text-right">
                      {isHindi ? 'कार्रवाई' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E3DA]/60">
                  {refundsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#7A8582]">
                        <RefreshCw size={16} className="animate-spin inline-block mr-2 text-[#0E4D44]" />
                        <span>Loading refund claims...</span>
                      </td>
                    </tr>
                  ) : !refundsData || refundsData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center font-bold">
                            <Check size={20} />
                          </div>
                          <div className="font-serif font-bold text-base text-[#14211F]">
                            {isHindi ? 'कोई रिफंड अनुरोध लंबित नहीं' : 'No refund requests found'}
                          </div>
                          <div className="text-xs text-[#7A8582]">
                            {isHindi
                              ? 'सभी रिफंड निपटान समय पर पूर्ण हो चुके हैं।'
                              : 'All student withdrawal claims have been settled or resolved.'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    refundsData.map((item) => {
                      const dueDate = new Date(item.payoutDueBy)
                      const isOverdue = nowMs > dueDate.getTime() && item.status !== 'paid' && item.status !== 'rejected'
                      const daysLeft = Math.ceil((dueDate.getTime() - nowMs) / (1000 * 60 * 60 * 24))
                      const isUrgent = daysLeft <= 3 && !isOverdue && item.status !== 'paid' && item.status !== 'rejected'

                      return (
                        <tr key={item._id} className="hover:bg-[#FAF8F4] transition-colors">
                          {/* Student */}
                          <td className="py-3.5 pr-2">
                            <div className="font-semibold text-sm text-[#14211F]">
                              {item.studentName || item.studentId}
                            </div>
                            <div className="text-[11px] font-mono text-[#7A8582]">{item.studentId}</div>
                          </td>

                          {/* Leave Date */}
                          <td className="py-3.5 pr-2 text-[#4A5654] font-medium">
                            {formatDate(item.leaveDate, lang)}
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 pr-2 text-right font-serif font-bold text-sm text-[#14211F] tabular-nums">
                            {formatPaise(item.refundPaise ?? item.refundAmountPaise)}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-2 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                                item.status === 'paid'
                                  ? 'bg-[#E8F4EC] text-[#1F7A4D]'
                                  : item.status === 'approved'
                                  ? 'bg-[#E6F0EE] text-[#0E4D44]'
                                  : item.status === 'rejected'
                                  ? 'bg-[#FDECEA] text-[#B3261E]'
                                  : 'bg-[#FFF4E0] text-[#9A5B0B]'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          {/* SLA Due Date */}
                          <td className="py-3.5 pr-2 text-[#4A5654]">
                            <div>
                              <div className="font-medium text-[#14211F]">
                                {formatDate(item.payoutDueBy, lang)}
                              </div>
                              {isOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B3261E]">
                                  <AlertCircle size={10} />
                                  <span>Overdue SLA</span>
                                </span>
                              ) : isUrgent ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D98A1E]">
                                  <Clock size={10} />
                                  <span>Due in {daysLeft} d</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#7A8582]">Within 10d SLA</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {item.status === 'calculated' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setActiveActionModal({ type: 'approve', refund: item })}
                                    className="h-7 px-2.5 rounded-lg bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-[11px] font-semibold transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveActionModal({ type: 'reject', refund: item })}
                                    className="h-7 px-2 rounded-lg border border-[#E7E3DA] bg-white hover:bg-[#FDECEA] hover:border-[#B3261E] hover:text-[#B3261E] text-[11px] font-semibold text-[#4A5654] transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {item.status === 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => setActiveActionModal({ type: 'paid', refund: item })}
                                  className="h-7 px-3 rounded-lg bg-[#1F7A4D] hover:bg-[#18623D] text-white text-[11px] font-semibold transition-colors"
                                >
                                  Mark Paid
                                </button>
                              )}

                              {(item.status === 'paid' || item.status === 'rejected') && (
                                <span className="text-[11px] text-[#7A8582] italic">Resolved</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          VIEW 2: STATUTORY REFUND CALCULATOR
         ────────────────────────────────────────────────────────── */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-[#0E4D44]" />
                <h2 className="font-serif font-bold text-lg text-[#14211F]">
                  {isHindi ? 'रिफंड गणना फ़ॉर्म' : 'Statutory Refund Calculation'}
                </h2>
              </div>
              <p className="text-xs text-[#4A5654] leading-relaxed">
                {isHindi
                  ? 'यह कैलकुलेटर प्रकाशित नीति के अनुसार स्वतः गणना करता है। किसी भी आंकड़े में मानवीय हेरफेर संभव नहीं है।'
                  : 'This calculator follows the published policy. Nothing is worked out by hand.'}
              </p>

              <form onSubmit={handleCalculate} className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="calc-stu" className="block text-xs font-semibold text-[#4A5654]">
                      {isHindi ? 'विद्यार्थी आईडी (Student ID)' : 'Student ID'}
                    </label>
                  </div>
                  <input
                    type="text"
                    id="calc-stu"
                    placeholder="e.g. STU-0412"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-mono font-bold text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="calc-date" className="block text-xs font-semibold text-[#4A5654]">
                      {isHindi ? 'कोर्स छोड़ने की तिथि (Leave Date)' : 'Course Leave / Withdrawal Date'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setLeaveDateInput(new Date().toISOString().slice(0, 10))}
                      className="text-[10px] text-[#0E4D44] font-medium hover:underline"
                    >
                      {isHindi ? 'आज की तिथि' : 'Today'}
                    </button>
                  </div>
                  <input
                    type="date"
                    id="calc-date"
                    value={leaveDateInput}
                    onChange={(e) => setLeaveDateInput(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                  />
                </div>

                {calcError && (
                  <div className="p-3 rounded-xl bg-[#FDECEA] border border-[#B3261E]/30 text-xs text-[#B3261E] flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{calcError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCalculating}
                  className="w-full h-10 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>{isHindi ? 'गणना जारी है...' : 'Running calculation...'}</span>
                    </>
                  ) : (
                    <span>{isHindi ? 'नीति के अनुसार गणना करें' : 'Calculate Refund Breakdown'}</span>
                  )}
                </button>
              </form>
            </div>

            {/* Expandable Policy Used Card */}
            <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 shadow-xs space-y-3">
              <button
                type="button"
                onClick={() => setPolicyExpanded(!policyExpanded)}
                className="w-full flex items-center justify-between text-xs font-semibold text-[#14211F]"
              >
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-[#0E4D44]" />
                  <span>{isHindi ? 'लागू रिफंड नियम देखें' : 'Governing Refund Policy v1.0'}</span>
                </div>
                {policyExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {policyExpanded && (
                <div className="pt-2 text-xs text-[#4A5654] space-y-2.5 border-t border-[#E7E3DA]">
                  <div className="p-2.5 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] space-y-1">
                    <div className="font-semibold text-[#14211F]">1. Registration Fee Retention</div>
                    <p className="text-[11px] text-[#7A8582]">
                      5% of tuition fee (capped at ₹5,000) is deducted towards administrative kit & LMS setup.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] space-y-1">
                    <div className="font-semibold text-[#14211F]">2. Pro-Rata Elapsed Days</div>
                    <p className="text-[11px] text-[#7A8582]">
                      Tuition consumed is deducted strictly by elapsed session calendar days.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#FAF8F4] border border-[#E7E3DA] space-y-1">
                    <div className="font-semibold text-[#14211F]">3. 18% GST Reversal Note</div>
                    <p className="text-[11px] text-[#7A8582]">
                      Reversal credit note issued under Section 34 of the CGST Act 2017.
                    </p>
                  </div>
                  <Link
                    to="/refund-policy"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E4D44] hover:underline pt-1"
                  >
                    <span>Read complete published policy document</span>
                    <ExternalLink size={11} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Card */}
          <div className="lg:col-span-7">
            {calcPreview ? (() => {
              const b = calcPreview.breakdown || {}
              const totalFee = b.feeAfterDiscountPaise ?? calcPreview.netTuitionFeePaise ?? calcPreview.totalFeePaise
              const paidFee = b.paidPaise ?? calcPreview.amountPaidPaise ?? calcPreview.paidPaise
              const deduction = b.deductionPaise ?? calcPreview.deductionPaise
              const consumed = b.consumedPaise ?? calcPreview.consumedTuitionPaise
              const daysElapsed = b.daysElapsed ?? calcPreview.daysElapsed
              const totalDays = b.totalCourseDays ?? calcPreview.totalSessionDays
              const retainedGst = b.gstOnRetainedPaise ?? calcPreview.retainedGstPaise ?? 0
              const finalRefund = calcPreview.refundPaise ?? calcPreview.finalRefundPaise ?? calcPreview.refundAmountPaise ?? 0

              return (
                <div className="bg-white rounded-2xl border border-[#E7E3DA] p-6 shadow-xs space-y-5 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-[#14211F]">
                        {isHindi ? 'विस्तृत रिफंड ब्रेकडाउन' : 'Line-by-Line Statutory Breakdown'}
                      </h3>
                      <div className="text-[11px] text-[#7A8582]">
                        Student ID: <span className="font-mono font-bold text-[#14211F]">{studentIdInput.toUpperCase()}</span> • Leave date: {formatDate(leaveDateInput, lang)}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F4EC] text-[#1F7A4D]">
                      Policy v1.0
                    </span>
                  </div>

                  {calcPreview.warning && (
                    <div className="p-3.5 rounded-xl bg-[#FFF4E0] border border-[#D98A1E]/30 text-xs text-[#9A5B0B] flex items-start gap-2">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <div>{calcPreview.warning}</div>
                    </div>
                  )}

                  {/* Line by line breakdown */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-[#E7E3DA]/60">
                      <div>
                        <span className="font-medium text-[#14211F]">Total Fee After Discount</span>
                        <div className="text-[10px] text-[#7A8582]">Base course fee - approved discount</div>
                      </div>
                      <span className="font-serif font-bold text-sm tabular-nums text-[#14211F]">
                        {formatPaise(totalFee)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-[#E7E3DA]/60">
                      <div>
                        <span className="font-medium text-[#1F7A4D]">Total Fee Paid by Student</span>
                        <div className="text-[10px] text-[#7A8582]">Collected receipts to date</div>
                      </div>
                      <span className="font-serif font-bold text-sm tabular-nums text-[#1F7A4D]">
                        {formatPaise(paidFee)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-[#E7E3DA]/60">
                      <div>
                        <span className="font-medium text-[#B3261E]">Registration & Kit Retention</span>
                        <div className="text-[10px] text-[#7A8582]">5% capped at ₹5,000 (Rule 1)</div>
                      </div>
                      <span className="font-serif font-bold text-sm tabular-nums text-[#B3261E]">
                        -{formatPaise(deduction)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-[#E7E3DA]/60">
                      <div>
                        <span className="font-medium text-[#B3261E]">Consumed Tuition (Pro-Rata Days)</span>
                        <div className="text-[10px] text-[#7A8582]">
                          ({daysElapsed} days elapsed / {totalDays} total session days) × Net Tuition
                        </div>
                      </div>
                      <span className="font-serif font-bold text-sm tabular-nums text-[#B3261E]">
                        -{formatPaise(consumed)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-[#E7E3DA]/60">
                      <div>
                        <span className="font-medium text-[#4A5654]">GST Portion of Retained Fees (18%)</span>
                        <div className="text-[10px] text-[#7A8582]">Tax invoice credit note adjustment</div>
                      </div>
                      <span className="font-serif font-bold text-sm tabular-nums text-[#4A5654]">
                        {formatPaise(retainedGst)}
                      </span>
                    </div>

                    {/* Explanatory note if refund is 0 */}
                    {finalRefund === 0 && (
                      <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] text-[11px] text-[#4A5654] leading-relaxed">
                        <strong className="text-[#14211F]">Statutory Policy Note:</strong>{' '}
                        {paidFee <= 0
                          ? 'This student has not paid any fees yet, so calculated refund is ₹0.'
                          : `The student consumed ${formatPaise(consumed)} of tuition (${daysElapsed} days) + ${formatPaise(deduction)} admin retention, which equals or exceeds the total fee paid (${formatPaise(paidFee)}). Under statutory pro-rata rules, no balance is refundable.`}
                      </div>
                    )}

                    {/* FINAL REFUND AMOUNT */}
                    <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-between mt-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#0E4D44]">
                          {isHindi ? 'अंतिम रिफंड राशि' : 'Final Statutory Refund'}
                        </div>
                        <div className="text-[11px] text-[#7A8582] mt-0.5">
                          Mandatory payout by: <strong className="text-[#14211F]">{formatDate(calcPreview.payoutDueBy, lang)}</strong> (10-day SLA)
                        </div>
                      </div>
                      <div className="font-serif font-bold text-3xl text-[#0E4D44] tabular-nums">
                        {formatPaise(finalRefund)}
                      </div>
                    </div>
                  </div>

                  {/* Create Request Action */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full h-11 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-2"
                    >
                      <Check size={14} />
                      <span>{isHindi ? 'रिफंड अनुरोध दर्ज करें (विद्यार्थी छोड़ चुका होगा)' : 'Create Official Refund Request'}</span>
                    </button>
                  </div>
                </div>
              )
            })() : (
              <div className="bg-white rounded-2xl border border-[#E7E3DA] p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-[#7A8582] flex items-center justify-center">
                  <Calculator size={22} />
                </div>
                <div className="font-serif font-bold text-base text-[#14211F]">
                  {isHindi ? 'गणना परिणाम यहां दिखेगा' : 'Enter Student ID & Leave Date'}
                </div>
                <p className="text-xs text-[#7A8582] max-w-sm">
                  The calculator pulls the student fee plan, paid receipts, elapsed days, and outputs a certified breakdown following institute policy.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          CONFIRM SAVE REFUND MODAL
         ────────────────────────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#14211F]/40 backdrop-blur-xs"
            onClick={() => !isSavingRefund && setShowConfirmModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-[#B3261E]">
              <AlertTriangle size={20} />
              <h3 className="font-serif font-bold text-lg text-[#14211F]">
                {isHindi ? 'रिफंड अनुरोध पुष्टि' : 'Confirm Refund Creation'}
              </h3>
            </div>
            <p className="text-xs text-[#4A5654] leading-relaxed">
              This will create an official statutory refund claim of{' '}
              <strong className="text-[#0E4D44]">
                {formatPaise(calcPreview?.refundPaise ?? calcPreview?.finalRefundPaise ?? calcPreview?.refundAmountPaise)}
              </strong>{' '}
              and permanently change student <strong className="font-mono text-[#14211F]">{studentIdInput}</strong> status to{' '}
              <strong className="text-[#B3261E]">"Left"</strong>.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E3DA]">
              <button
                type="button"
                disabled={isSavingRefund}
                onClick={() => setShowConfirmModal(false)}
                className="h-9 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] hover:bg-[#FAF8F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingRefund}
                onClick={handleConfirmSave}
                className="h-9 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSavingRefund ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Confirm & Mark Left</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          WORKFLOW ACTION MODAL (APPROVE / REJECT / MARK PAID)
         ────────────────────────────────────────────────────────── */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#14211F]/40 backdrop-blur-xs"
            onClick={() => !isSubmittingAction && setActiveActionModal(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E3DA]">
              <h3 className="font-serif font-bold text-lg text-[#14211F]">
                {activeActionModal.type === 'approve'
                  ? 'Approve Refund Claim'
                  : activeActionModal.type === 'reject'
                  ? 'Reject Refund Claim'
                  : 'Confirm Bank Payout (Mark Paid)'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-[#4A5654] space-y-1">
              <div>
                Student: <strong>{activeActionModal.refund.studentName || activeActionModal.refund.studentId}</strong>
              </div>
              <div>
                Refund Amount:{' '}
                <strong className="text-[#0E4D44] font-serif font-bold text-sm">
                  {formatPaise(activeActionModal.refund.refundPaise ?? activeActionModal.refund.refundAmountPaise)}
                </strong>
              </div>
            </div>

            {activeActionModal.type === 'reject' && (
              <div>
                <label htmlFor="rej-note" className="block text-xs font-semibold text-[#4A5654] mb-1">
                  Reason for Rejection <span className="text-[#B3261E]">*</span>
                </label>
                <textarea
                  id="rej-note"
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="State the audit or policy non-compliance reason..."
                  required
                  className="w-full p-2.5 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E3DA]">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => setActiveActionModal(null)}
                className="h-9 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] hover:bg-[#FAF8F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleWorkflowAction}
                className={`h-9 px-4 rounded-xl text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
                  activeActionModal.type === 'reject'
                    ? 'bg-[#B3261E] hover:bg-[#8F1E17]'
                    : activeActionModal.type === 'paid'
                    ? 'bg-[#1F7A4D] hover:bg-[#18623D]'
                    : 'bg-[#0E4D44] hover:bg-[#0A3B34]'
                }`}
              >
                {isSubmittingAction && <Loader2 size={13} className="animate-spin" />}
                <span>
                  {activeActionModal.type === 'approve'
                    ? 'Confirm Approval'
                    : activeActionModal.type === 'reject'
                    ? 'Confirm Rejection'
                    : 'Confirm Paid'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
