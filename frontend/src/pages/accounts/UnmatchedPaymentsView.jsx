import { useState } from 'react'
import {
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Loader2,
  AlertCircle,
  X,
  Check,
  Code2,
  ShieldAlert,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../context/useAuth'
import * as staffApi from '../../services/staffApi'
import { formatPaise, formatDate } from '../../utils/format'
import { useLang } from '../../i18n/useLang'

export default function UnmatchedPaymentsView() {
  const { lang } = useLang()
  const isHindi = lang === 'hi'
  const { showToast } = useAuth()

  const [activeTab, setActiveTab] = useState('open') // 'open' | 'matched' | 'rejected'
  const [expandedPayloadId, setExpandedPayloadId] = useState(null)
  const [activeMatchItem, setActiveMatchItem] = useState(null)
  const [activeRejectItem, setActiveRejectItem] = useState(null)

  // Matching dialog form states
  const [studentSearchId, setStudentSearchId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedInstalmentId, setSelectedInstalmentId] = useState('')
  const [isSearchingStudent, setIsSearchingStudent] = useState(false)
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Fetch Payments by Tab
  const {
    data: items,
    isLoading,
    refetch,
  } = useApi(() => staffApi.getUnmatchedPayments({ status: activeTab }), [activeTab])

  // Search Student for Matching
  const handleSearchStudent = async () => {
    if (!studentSearchId.trim()) return
    setIsSearchingStudent(true)
    setSelectedStudent(null)
    setSelectedInstalmentId('')

    try {
      const res = await staffApi.getStudentDetail(studentSearchId.trim().toUpperCase())
      setSelectedStudent(res)
    } catch (err) {
      showToast(err.message || (isHindi ? 'विद्यार्थी नहीं मिला' : 'Student not found'), 'error')
    } finally {
      setIsSearchingStudent(false)
    }
  }

  // Confirm Matching
  const handleConfirmMatch = async () => {
    if (!activeMatchItem || !selectedInstalmentId) return
    setIsSubmittingMatch(true)

    try {
      const res = await staffApi.matchUnmatchedPayment(activeMatchItem._id, {
        instalmentId: selectedInstalmentId,
      })
      const receiptNo = res?.receipt?.receiptNo || 'RCP-MATCHED'
      showToast(
        isHindi
          ? `भुगतान समायोजित हुआ! रसीद संख्या: ${receiptNo}`
          : `Payment matched to instalment! Receipt ${receiptNo} issued.`,
        'success'
      )
      setActiveMatchItem(null)
      setSelectedStudent(null)
      setSelectedInstalmentId('')
      setStudentSearchId('')
      refetch()
    } catch (err) {
      showToast(err.message || (isHindi ? 'समायोजन विफल' : 'Failed to match payment'), 'error')
    } finally {
      setIsSubmittingMatch(false)
    }
  }

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (!activeRejectItem || !rejectReason.trim()) return
    setIsSubmittingMatch(true)

    try {
      await staffApi.rejectUnmatchedPayment(activeRejectItem._id, {
        reason: rejectReason.trim(),
      })
      showToast(isHindi ? 'भुगतान अस्वीकृत किया गया।' : 'Payment rejected.', 'info')
      setActiveRejectItem(null)
      setRejectReason('')
      refetch()
    } catch (err) {
      showToast(err.message || (isHindi ? 'अस्वीकृति विफल' : 'Failed to reject payment'), 'error')
    } finally {
      setIsSubmittingMatch(false)
    }
  }

  // Selected instalment for matching preview
  const chosenInstalment = selectedStudent?.instalments?.find((i) => i._id === selectedInstalmentId)
  const remainingAfterMatch = chosenInstalment
    ? Math.max(0, chosenInstalment.balancePaise - (activeMatchItem?.amountPaise || 0))
    : null
  const isAmountExcess =
    chosenInstalment && (activeMatchItem?.amountPaise || 0) > chosenInstalment.balancePaise

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ──────────────────────────────────────────────────────────
          HEADER
         ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E3DA]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#14211F] tracking-tight">
              {isHindi ? 'भुगतान कतार' : 'Payments Queue'}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF4E0] text-[#9A5B0B] border border-[#D98A1E]/30">
              {isHindi ? 'मैन्युअल सत्यापन' : 'Unmatched Inbound'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#4A5654] mt-1 font-medium">
            {isHindi
              ? 'जब तक आप मिलान नहीं करते, तब तक किसी भी किस्त को चुकता नहीं माना जाता है।'
              : 'Nothing is marked paid until you match it.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-[#E7E3DA] bg-white hover:border-[#0E4D44] hover:text-[#0E4D44] text-xs font-semibold text-[#4A5654] transition-colors shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#0E4D44]' : ''} />
          <span>{isHindi ? 'रीफ्रेश' : 'Refresh'}</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
          TABS: OPEN, MATCHED, REJECTED
         ────────────────────────────────────────────────────────── */}
      <div className="border-b border-[#E7E3DA] flex items-center gap-6 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('open')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'open'
              ? 'border-[#0E4D44] text-[#0E4D44]'
              : 'border-transparent text-[#7A8582] hover:text-[#14211F]'
          }`}
        >
          <span>{isHindi ? 'लंबित (Open)' : 'Open Queue'}</span>
          {activeTab === 'open' && items && items.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#D98A1E] text-white text-[10px] font-bold">
              {items.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matched')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'matched'
              ? 'border-[#0E4D44] text-[#0E4D44]'
              : 'border-transparent text-[#7A8582] hover:text-[#14211F]'
          }`}
        >
          <span>{isHindi ? 'समायोजित (Matched)' : 'Matched'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'rejected'
              ? 'border-[#0E4D44] text-[#0E4D44]'
              : 'border-transparent text-[#7A8582] hover:text-[#14211F]'
          }`}
        >
          <span>{isHindi ? 'अस्वीकृत (Rejected)' : 'Rejected'}</span>
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────
          PAYMENTS LIST TABLE
         ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E7E3DA] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" aria-label="Unmatched Inbound Payments">
            <thead className="border-b border-[#E7E3DA] text-[#7A8582] font-semibold">
              <tr>
                <th scope="col" className="pb-3">
                  {isHindi ? 'प्राप्ति समय' : 'Received Time'}
                </th>
                <th scope="col" className="pb-3 text-right">
                  {isHindi ? 'प्राप्त राशि' : 'Amount'}
                </th>
                <th scope="col" className="pb-3">
                  {isHindi ? 'संदर्भ (Ref / UTR)' : 'Reference / UTR'}
                </th>
                <th scope="col" className="pb-3">
                  {isHindi ? 'अनमैच्ड रहने का कारण' : 'Reason Unmatched'}
                </th>
                <th scope="col" className="pb-3 text-center">
                  {isHindi ? 'पेलोड' : 'Raw Payload'}
                </th>
                <th scope="col" className="pb-3 text-right">
                  {isHindi ? 'कार्रवाई' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E3DA]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#7A8582]">
                    <RefreshCw size={16} className="animate-spin inline-block mr-2 text-[#0E4D44]" />
                    <span>Loading payments queue...</span>
                  </td>
                </tr>
              ) : !items || items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#E8F4EC] text-[#1F7A4D] flex items-center justify-center font-bold">
                        <Check size={20} />
                      </div>
                      <div className="font-serif font-bold text-base text-[#14211F]">
                        {isHindi ? 'कतार साफ़ है (Queue is clear)' : 'Queue is clear.'}
                      </div>
                      <div className="text-xs text-[#7A8582]">
                        {isHindi
                          ? 'कोई भी आवक भुगतान सत्यापन हेतु लंबित नहीं है।'
                          : 'No inbound payments require manual reconciliation right now.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isPayloadExpanded = expandedPayloadId === item._id

                  return (
                    <tr key={item._id} className="hover:bg-[#FAF8F4] transition-colors">
                      {/* Received Time */}
                      <td className="py-3.5 pr-2 font-medium text-[#14211F]">
                        <div>{formatDate(item.createdAt, lang)}</div>
                        <div className="text-[10px] text-[#7A8582]">
                          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 pr-2 text-right font-serif font-bold text-sm text-[#14211F] tabular-nums">
                        {formatPaise(item.amountPaise)}
                      </td>

                      {/* Reference */}
                      <td className="py-3.5 pr-2 font-mono text-[11px] text-[#4A5654]">
                        {item.reference || item.gatewayRef || '—'}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 pr-2 text-[#B3261E] font-medium">
                        {item.reason || 'Reference not found'}
                      </td>

                      {/* Raw Payload Toggle */}
                      <td className="py-3.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedPayloadId(isPayloadExpanded ? null : item._id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0E4D44] hover:underline"
                        >
                          <Code2 size={12} />
                          <span>{isPayloadExpanded ? 'Hide' : 'View'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-right">
                        {activeTab === 'open' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMatchItem(item)
                                setStudentSearchId('')
                                setSelectedStudent(null)
                                setSelectedInstalmentId('')
                              }}
                              className="h-7 px-2.5 rounded-lg bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-[11px] font-semibold transition-colors"
                            >
                              Match
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveRejectItem(item)
                                setRejectReason('')
                              }}
                              className="h-7 px-2 rounded-lg border border-[#E7E3DA] bg-white hover:bg-[#FDECEA] hover:border-[#B3261E] hover:text-[#B3261E] text-[11px] font-semibold text-[#4A5654] transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#7A8582] italic capitalize">
                            {item.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Expandable JSON Payload Drawer */}
        {expandedPayloadId && (
          <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#14211F]">
              <span>Inbound Gateway Payload Record:</span>
              <button
                type="button"
                onClick={() => setExpandedPayloadId(null)}
                className="text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={14} />
              </button>
            </div>
            <pre className="text-[11px] font-mono text-[#4A5654] bg-white p-3 rounded-lg border border-[#E7E3DA] overflow-x-auto max-h-40">
              {JSON.stringify(
                items?.find((i) => i._id === expandedPayloadId)?.payload || { note: 'No raw payload stored' },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────
          MATCH TO INSTALMENT MODAL
         ────────────────────────────────────────────────────────── */}
      {activeMatchItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#14211F]/40 backdrop-blur-xs"
            onClick={() => !isSubmittingMatch && setActiveMatchItem(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-lg w-full shadow-xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DA]">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-[#0E4D44]" />
                <h3 className="font-serif font-bold text-lg text-[#14211F]">
                  Match Inbound Payment
                </h3>
              </div>
              <button
                type="button"
                disabled={isSubmittingMatch}
                onClick={() => setActiveMatchItem(null)}
                className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inbound Details */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-[#E7E3DA] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#7A8582]">Inbound Amount: </span>
                <strong className="font-serif text-[#0E4D44] text-base">{formatPaise(activeMatchItem.amountPaise)}</strong>
              </div>
              <div>
                <span className="text-[#7A8582]">Ref: </span>
                <strong className="font-mono text-[#14211F]">{activeMatchItem.reference || '—'}</strong>
              </div>
            </div>

            {/* Step 1: Search Student */}
            <div className="space-y-2">
              <label htmlFor="m-stu" className="block text-xs font-semibold text-[#4A5654]">
                Step 1: Search Student ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="m-stu"
                  placeholder="e.g. STU-0219"
                  value={studentSearchId}
                  onChange={(e) => setStudentSearchId(e.target.value)}
                  className="flex-1 h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-mono font-bold text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                />
                <button
                  type="button"
                  onClick={handleSearchStudent}
                  disabled={isSearchingStudent}
                  className="h-10 px-4 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  {isSearchingStudent ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                  <span>Find</span>
                </button>
              </div>
            </div>

            {/* Step 2: Select Instalment & Preview Balance */}
            {selectedStudent && (
              <div className="space-y-3 pt-2 border-t border-[#E7E3DA]">
                <div className="text-xs text-[#14211F]">
                  Student: <strong>{selectedStudent.name}</strong> ({selectedStudent.batch} • {selectedStudent.centre})
                </div>

                <div>
                  <label htmlFor="m-inst" className="block text-xs font-semibold text-[#4A5654] mb-1">
                    Step 2: Choose Unpaid Instalment
                  </label>
                  <select
                    id="m-inst"
                    value={selectedInstalmentId}
                    onChange={(e) => setSelectedInstalmentId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
                  >
                    <option value="">Select instalment...</option>
                    {selectedStudent.instalments
                      ?.filter((i) => i.balancePaise > 0)
                      .map((i) => (
                        <option key={i._id} value={i._id}>
                          Instalment {i.sequence} • Balance: {formatPaise(i.balancePaise)} (Due: {formatDate(i.dueDate, lang)})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Preview Balance After Matching */}
                {chosenInstalment && (
                  <div className="p-3.5 rounded-xl border border-[#E7E3DA] bg-white space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#7A8582]">Current Balance:</span>
                      <span className="font-semibold text-[#14211F]">{formatPaise(chosenInstalment.balancePaise)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7A8582]">Applied Payment:</span>
                      <span className="font-semibold text-[#1F7A4D]">-{formatPaise(activeMatchItem.amountPaise)}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-[#E7E3DA] font-bold">
                      <span>Remaining Balance After Match:</span>
                      <span className={isAmountExcess ? 'text-[#B3261E]' : 'text-[#0E4D44]'}>
                        {formatPaise(remainingAfterMatch)}
                      </span>
                    </div>
                    {isAmountExcess && (
                      <div className="text-[11px] text-[#B3261E] pt-1 flex items-center gap-1 font-medium">
                        <AlertCircle size={12} />
                        <span>Warning: Inbound amount exceeds the instalment balance.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7E3DA]">
              <button
                type="button"
                disabled={isSubmittingMatch}
                onClick={() => setActiveMatchItem(null)}
                className="h-10 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] hover:bg-[#FAF8F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingMatch || !selectedInstalmentId}
                onClick={handleConfirmMatch}
                className="h-10 px-5 rounded-xl bg-[#0E4D44] hover:bg-[#0A3B34] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSubmittingMatch ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Confirm Match & Issue Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
          REJECT PAYMENT MODAL
         ────────────────────────────────────────────────────────── */}
      {activeRejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#14211F]/40 backdrop-blur-xs"
            onClick={() => !isSubmittingMatch && setActiveRejectItem(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl border border-[#E7E3DA] p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E3DA]">
              <h3 className="font-serif font-bold text-lg text-[#14211F]">
                Reject Inbound Payment
              </h3>
              <button
                type="button"
                onClick={() => setActiveRejectItem(null)}
                className="p-1 rounded-lg text-[#7A8582] hover:text-[#14211F]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-[#4A5654]">
              Amount: <strong className="font-serif text-sm text-[#14211F]">{formatPaise(activeRejectItem.amountPaise)}</strong>
            </div>

            <div>
              <label htmlFor="m-rej-reason" className="block text-xs font-semibold text-[#4A5654] mb-1">
                Reason for Rejection <span className="text-[#B3261E]">*</span>
              </label>
              <textarea
                id="m-rej-reason"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="State the audit / fraud / unidentifiable reason..."
                required
                className="w-full p-2.5 rounded-xl border border-[#E7E3DA] bg-[#FAF8F4] text-xs font-medium text-[#14211F] focus:outline-none focus:ring-2 focus:ring-[#0E4D44]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E7E3DA]">
              <button
                type="button"
                disabled={isSubmittingMatch}
                onClick={() => setActiveRejectItem(null)}
                className="h-9 px-4 rounded-xl border border-[#E7E3DA] bg-white text-xs font-semibold text-[#4A5654] hover:bg-[#FAF8F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingMatch || !rejectReason.trim()}
                onClick={handleConfirmReject}
                className="h-9 px-4 rounded-xl bg-[#B3261E] hover:bg-[#8F1E17] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSubmittingMatch ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
